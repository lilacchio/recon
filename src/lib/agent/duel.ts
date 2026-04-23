import { z } from "zod";
import { chat, chatStream, LLM_FAST, LLM_SMART, type StreamEvent } from "../llm";
import {
  HAWK_SYSTEM,
  OWL_SYSTEM,
  ARBITER_SYSTEM,
  arbiterPayload,
  userPayload,
  PROMPT_VERSION,
} from "./prompts";
import type { Snapshot } from "./snapshot";

export const CallDecisionSchema = z.object({
  direction: z.enum(["long", "short", "watch"]),
  conviction: z.number().int().min(0).max(100),
  horizon: z.enum(["1h", "4h", "24h", "7d"]),
  risk: z.number().int().min(1).max(10),
  reasoning: z.string().min(10).max(800),
});
export type CallDecision = z.infer<typeof CallDecisionSchema>;

export type AgentVerdict = CallDecision & {
  tokensIn: number;
  tokensOut: number;
  model: string;
  ms: number;
};

export type ArbiterResult = {
  winner: "hawk" | "owl" | "compromise";
  reasoning: string;
  final: CallDecision;
  tokensIn: number;
  tokensOut: number;
  model: string;
  ms: number;
};

export type DuelResult = {
  promptVersion: string;
  hawk: AgentVerdict;
  owl: AgentVerdict;
  disagreed: boolean;
  arbiter: ArbiterResult | null;
  resolved: CallDecision;
  chosenBy: "hawk" | "owl" | "arbiter" | "consensus";
};

// Optional per-token streaming hook. runDuel invokes emit() on every delta if provided.
export type DuelEvent =
  | { kind: "hawk_delta"; text: string }
  | { kind: "owl_delta"; text: string }
  | { kind: "hawk_done"; verdict: AgentVerdict }
  | { kind: "owl_done"; verdict: AgentVerdict }
  | { kind: "arbiter_delta"; text: string }
  | { kind: "arbiter_done"; arbiter: ArbiterResult }
  | { kind: "resolved"; result: DuelResult };

export type EmitFn = (e: DuelEvent) => void;

const CONVICTION_GAP_THRESHOLD = 20;

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

function parseDecision(text: string): CallDecision | null {
  try {
    const obj = JSON.parse(extractJson(text));
    const parsed = CallDecisionSchema.safeParse(obj);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function runAgent(
  model: string,
  systemPrompt: string,
  userText: string,
  emit: EmitFn | undefined,
  deltaKind: "hawk_delta" | "owl_delta",
): Promise<AgentVerdict> {
  const t0 = Date.now();
  let full = "";
  let usageIn = 0;
  let usageOut = 0;

  for await (const ev of chatStream({
    model,
    temperature: 0.3,
    maxTokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
  })) {
    if (ev.kind === "delta") {
      full += ev.text;
      emit?.({ kind: deltaKind, text: ev.text });
    } else {
      usageIn = ev.usage.in;
      usageOut = ev.usage.out;
    }
  }

  const decision = parseDecision(full);
  const ms = Date.now() - t0;
  if (!decision) {
    throw new Error(`${model} returned invalid JSON: ${full.slice(0, 200)}`);
  }
  return { ...decision, model, tokensIn: usageIn, tokensOut: usageOut, ms };
}

function shouldArbitrate(h: CallDecision, o: CallDecision): boolean {
  if (h.direction !== o.direction) return true;
  if (Math.abs(h.conviction - o.conviction) >= CONVICTION_GAP_THRESHOLD) return true;
  return false;
}

async function runArbiter(
  snapshotText: string,
  h: AgentVerdict,
  o: AgentVerdict,
  useSmart: boolean,
  emit: EmitFn | undefined,
): Promise<ArbiterResult> {
  const t0 = Date.now();
  const model = useSmart ? LLM_SMART : LLM_FAST;
  let full = "";
  let usageIn = 0;
  let usageOut = 0;

  for await (const ev of chatStream({
    model,
    temperature: 0.2,
    maxTokens: 500,
    messages: [
      { role: "system", content: ARBITER_SYSTEM },
      { role: "user", content: arbiterPayload(snapshotText, h, o) },
    ],
  })) {
    if (ev.kind === "delta") {
      full += ev.text;
      emit?.({ kind: "arbiter_delta", text: ev.text });
    } else {
      usageIn = ev.usage.in;
      usageOut = ev.usage.out;
    }
  }

  const ArbiterSchema = z.object({
    winner: z.enum(["hawk", "owl", "compromise"]),
    reasoning: z.string().min(10).max(800),
    final: CallDecisionSchema,
  });

  let parsed: z.infer<typeof ArbiterSchema> | null = null;
  try {
    parsed = ArbiterSchema.parse(JSON.parse(extractJson(full)));
  } catch {
    // Fallback: pick owl (the deeper model), quote the raw text.
    parsed = {
      winner: "owl",
      reasoning: "Arbiter output unparseable; falling back to owl.",
      final: { ...o, reasoning: o.reasoning },
    };
  }
  const ms = Date.now() - t0;
  return { ...parsed, tokensIn: usageIn, tokensOut: usageOut, model, ms };
}

export async function runDuel(
  snapshot: Snapshot,
  opts: { emit?: EmitFn; useSmartArbiter?: boolean } = {},
): Promise<DuelResult> {
  const userText = userPayload(snapshot);
  const emit = opts.emit;

  // Run both agents in parallel. Each emits its own stream as it goes.
  const [hawk, owl] = await Promise.all([
    runAgent(LLM_FAST, HAWK_SYSTEM, userText, emit, "hawk_delta").then((v) => {
      emit?.({ kind: "hawk_done", verdict: v });
      return v;
    }),
    runAgent(LLM_SMART, OWL_SYSTEM, userText, emit, "owl_delta").then((v) => {
      emit?.({ kind: "owl_done", verdict: v });
      return v;
    }),
  ]);

  const disagreed = shouldArbitrate(hawk, owl);
  let arbiter: ArbiterResult | null = null;
  let resolved: CallDecision;
  let chosenBy: DuelResult["chosenBy"];

  if (disagreed) {
    arbiter = await runArbiter(userText, hawk, owl, opts.useSmartArbiter ?? true, emit);
    emit?.({ kind: "arbiter_done", arbiter });
    resolved = arbiter.final;
    chosenBy =
      arbiter.winner === "hawk"
        ? "hawk"
        : arbiter.winner === "owl"
        ? "owl"
        : "arbiter";
  } else {
    // Consensus: pick the fuller reasoning — owl usually wins on length.
    const pick = owl.reasoning.length >= hawk.reasoning.length ? owl : hawk;
    resolved = {
      direction: pick.direction,
      conviction: Math.round((hawk.conviction + owl.conviction) / 2),
      horizon: pick.horizon,
      risk: Math.max(hawk.risk, owl.risk),
      reasoning: pick.reasoning,
    };
    chosenBy = "consensus";
  }

  const result: DuelResult = {
    promptVersion: PROMPT_VERSION,
    hawk,
    owl,
    disagreed,
    arbiter,
    resolved,
    chosenBy,
  };
  emit?.({ kind: "resolved", result });
  return result;
}
