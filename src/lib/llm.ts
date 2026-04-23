import OpenAI from "openai";

const KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

export const LLM_FAST = process.env.LLM_MODEL_FAST ?? "anthropic/claude-haiku-4.5";
export const LLM_SMART = process.env.LLM_MODEL_SMART ?? "anthropic/claude-sonnet-4.6";

let _client: OpenAI | null = null;
export function llm(): OpenAI {
  if (!KEY) throw new Error("OPENROUTER_API_KEY is not set");
  if (!_client) {
    _client = new OpenAI({
      apiKey: KEY,
      baseURL: BASE_URL,
      // OpenRouter asks for these for analytics / rate limits
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "recon",
      },
    });
  }
  return _client;
}

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(opts: {
  model?: string;
  messages: Msg[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage: { in: number; out: number } }> {
  const res = await llm().chat.completions.create({
    model: opts.model ?? LLM_FAST,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 400,
    temperature: opts.temperature ?? 0.4,
  });
  const text = res.choices[0]?.message?.content ?? "";
  return {
    text,
    usage: {
      in: res.usage?.prompt_tokens ?? 0,
      out: res.usage?.completion_tokens ?? 0,
    },
  };
}

export type StreamEvent =
  | { kind: "delta"; text: string }
  | { kind: "done"; text: string; usage: { in: number; out: number } };

// Streams the model's response. Consumer gets deltas as they arrive, and a final
// `done` event with the full text + usage totals.
export async function* chatStream(opts: {
  model?: string;
  messages: Msg[];
  maxTokens?: number;
  temperature?: number;
}): AsyncGenerator<StreamEvent> {
  const stream = await llm().chat.completions.create({
    model: opts.model ?? LLM_FAST,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 400,
    temperature: opts.temperature ?? 0.4,
    stream: true,
    stream_options: { include_usage: true },
  });

  let full = "";
  let usageIn = 0;
  let usageOut = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      yield { kind: "delta", text: delta };
    }
    if (chunk.usage) {
      usageIn = chunk.usage.prompt_tokens ?? usageIn;
      usageOut = chunk.usage.completion_tokens ?? usageOut;
    }
  }

  yield { kind: "done", text: full, usage: { in: usageIn, out: usageOut } };
}
