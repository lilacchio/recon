import { sbAdmin } from "./supabase";

export type DuelCallRow = {
  id: string;
  address: string;
  symbol: string;
  name: string;
  direction: "long" | "short" | "watch";
  conviction: number;
  horizon: "1h" | "4h" | "24h" | "7d";
  risk: number;
  reasoning: string;
  disagreed: boolean;
  chosenBy: "hawk" | "owl" | "arbiter" | "consensus";
  arbiterReasoning: string | null;
  hawk: DuelAgentDecision;
  owl: DuelAgentDecision;
  createdAt: string;
  priceAtCall: number;
  signals: Record<string, unknown>;
};

export type DuelAgentDecision = {
  direction: "long" | "short" | "watch";
  conviction: number;
  horizon: "1h" | "4h" | "24h" | "7d";
  risk: number;
  reasoning: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  ms: number;
};

export async function getLastDisagreed(): Promise<DuelCallRow | null> {
  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select("id")
    .eq("disagreed", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return null;
  return getDuelCall(data.id);
}

export async function getDuelCall(id: string): Promise<DuelCallRow | null> {
  const sb = sbAdmin();
  const { data, error } = await sb
    .from("calls")
    .select(
      `id, token_address, direction, conviction, horizon, risk, reasoning,
       disagreed, chosen_by, arbiter_reasoning, hawk_decision, owl_decision,
       price_at_call, signals, created_at,
       tokens:tokens!inner(symbol, name)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  // Supabase join type is {...}[] when inferred loosely; coerce.
  const tok = Array.isArray(data.tokens) ? data.tokens[0] : data.tokens;
  const hawk = data.hawk_decision as DuelAgentDecision;
  const owl = data.owl_decision as DuelAgentDecision;

  return {
    id: data.id,
    address: data.token_address,
    symbol: tok?.symbol ?? "—",
    name: tok?.name ?? "",
    direction: data.direction,
    conviction: data.conviction,
    horizon: data.horizon,
    risk: data.risk,
    reasoning: data.reasoning,
    disagreed: data.disagreed,
    chosenBy: data.chosen_by,
    arbiterReasoning: data.arbiter_reasoning,
    hawk,
    owl,
    createdAt: data.created_at,
    priceAtCall: typeof data.price_at_call === "string"
      ? parseFloat(data.price_at_call)
      : data.price_at_call,
    signals: (data.signals as Record<string, unknown>) ?? {},
  };
}
