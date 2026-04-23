# RECON — spec

An autonomous Solana alpha agent with a twist: **two AIs watch the same tokens, reason out loud, and fight for the final call.** Every disagreement becomes a public artifact. Every call is filed to a track record it can't hide from.

One-line pitch: *the Solana alpha agent that argues with itself in public — and keeps the receipts.*

## Why this shape wins

The bounty is judged on community engagement on X, product utility, technical depth, and presentation. Every other submission will be "AI picks tokens + dashboard" — a 2023 idea.

The wedge: **Agent Duel + Live Reasoning Stream.** Two LLMs (Haiku 4.5 = "hawk", fast & cheap; Sonnet 4.6 = "owl", deep & expensive) are fed the same Birdeye snapshot and score it in parallel. Their reasoning streams character-by-character. When they disagree (different direction, or conviction gap ≥20), a third "arbiter" prompt picks the winner and the reasoning gets published verbatim. The final call is tagged with which model won.

This is:
- **Novel** — never been shipped in crypto. Every AI picker is a single black box.
- **Screenshot-bait** — "Haiku said LONG 78, Sonnet said WATCH 42, token rugged 40m later" writes its own viral thread.
- **Honest** — shows AI uncertainty instead of hiding it. Technical judges will notice.
- **Deeper API usage** — each agent can request follow-up Birdeye endpoints independently (hawk pulls flow, owl pulls deployer history). Showcases the API's depth.
- **The product is the demo** — land on the homepage and see two AIs debating live. You get the value proposition in 4 seconds.

## Scope

**Core (ships):**
- Background worker scans Birdeye on a schedule, writes candidates to DB.
- **Dual scoring**: both Haiku and Sonnet score the same snapshot. Streaming responses captured token-by-token.
- **Arbiter**: when they disagree, a third prompt resolves to one final call + explains why.
- Public dashboard: live feed of resolved calls with the disagreement history exposed.
- **Duel page** (`/duel/[id]`): dual-panel replay of a specific disagreement. The main wow artifact.
- **Track record** (`/track`) with a **calibration chart** (accuracy by conviction bucket, bucketed per-model).
- **Kill list** (`/kills`): biggest losses, pinned, reasoning replayed. Turning weakness into character.
- **Data receipts**: every call detail page shows the actual Birdeye endpoints hit + response excerpts.
- Accuracy job refreshes PnL on open calls.

**Stretch:**
- Live-streaming duel panel on homepage (SSE) when the worker is actively scoring.
- Telegram push on any 70+ conviction call where the agents disagreed.
- Per-model leaderboard: hawk vs owl lifetime win rate.

**Out of scope:** wallet connect, user auth, multi-chain.

## Architecture

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Vercel cron     │───▶│  Scan worker     │───▶│  Birdeye API     │
│  every 15 min    │    │  (API route)     │    │  (1 req/s)       │
└──────────────────┘    └────────┬─────────┘    └──────────────────┘
                                 │
                          Snapshot per candidate
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
           ┌──────────────┐           ┌──────────────┐
           │  HAWK        │           │  OWL         │
           │  Haiku 4.5   │           │  Sonnet 4.6  │   (parallel, streaming)
           └──────┬───────┘           └──────┬───────┘
                  │                          │
                  └────────────┬─────────────┘
                               ▼
                    ┌────────────────────┐
                    │  Arbiter           │
                    │  (fires only if    │
                    │  decisions differ) │
                    └──────────┬─────────┘
                               ▼
                     ┌────────────────────┐
                     │  Supabase          │
                     │  calls (+ both     │
                     │  decisions)        │
                     │  price_snaps       │
                     │  tokens            │
                     └──────────┬─────────┘
                                ▼
                     ┌────────────────────┐
                     │  Next.js front     │
                     │  /  feed           │
                     │  /duel/[id]        │
                     │  /track            │
                     │  /kills            │
                     │  /calls/[id]       │
                     └────────────────────┘
```

## Data model

```sql
create table tokens (
  address       text primary key,
  symbol        text,
  name          text,
  logo_uri      text,
  decimals      int,
  first_seen_at timestamptz default now()
);

-- A resolved call (post-arbitration). The raw decisions are stored in JSONB.
create table calls (
  id                uuid primary key default gen_random_uuid(),
  token_address     text references tokens(address) on delete cascade,
  -- resolved output
  direction         text not null check (direction in ('long','short','watch')),
  conviction        smallint not null check (conviction between 0 and 100),
  horizon           text not null check (horizon in ('1h','4h','24h','7d')),
  risk              smallint not null check (risk between 1 and 10),
  reasoning         text not null,
  -- the duel
  hawk_decision     jsonb not null,      -- { direction, conviction, horizon, risk, reasoning, tokens_in, tokens_out, ms }
  owl_decision      jsonb not null,
  disagreed         boolean not null,    -- true if direction differs or conviction gap ≥ 20
  chosen_by         text not null check (chosen_by in ('hawk','owl','arbiter','consensus')),
  arbiter_reasoning text,                -- only present when disagreed = true
  -- context
  signals           jsonb not null,      -- full snapshot + heuristics + endpoint trace (data receipts)
  price_at_call     numeric not null,
  liquidity_at_call numeric,
  created_at        timestamptz default now()
);

create table price_snaps (
  call_id   uuid references calls(id) on delete cascade,
  taken_at  timestamptz default now(),
  price     numeric not null,
  pnl_pct   numeric,
  primary key (call_id, taken_at)
);

create index calls_created_at_idx on calls(created_at desc);
create index calls_conviction_idx on calls(conviction desc);
create index calls_disagreed_idx  on calls(disagreed, created_at desc);
create index calls_chosen_by_idx  on calls(chosen_by);
```

Public read via Row Level Security: anyone can `select` on all three tables. All writes go through service role.

## The Duel mechanic

### Parallel scoring
Both agents receive:
1. The same `SYSTEM_PROMPT` + snapshot payload (see `lib/agent/prompts.ts`).
2. Separate follow-up tool hints: hawk can ask for `recent_txns`, owl can ask for `deployer_history` (we construct this by walking `/defi/txs/token` back to the deployer wallet's past-token list via trending cross-reference).

Each agent runs via **OpenRouter streaming** (`stream: true`). We collect tokens as they arrive and persist the final parsed decision. The stream is also broadcast to the frontend over SSE when the worker runs in "live" mode.

### Disagreement detection
```
disagreed := hawk.direction != owl.direction
          OR abs(hawk.conviction - owl.conviction) >= 20
```

### Arbiter
When `disagreed == true`, we run a third LLM call:
- Model: Sonnet 4.6 (we trust the smarter model to judge).
- Input: the snapshot + both decisions verbatim.
- Output: `{ winner: 'hawk'|'owl'|'compromise', reasoning, final: <decision> }`.
- `compromise` = arbiter writes its own decision blending both positions, tagged `chosen_by='arbiter'`.

When `disagreed == false`, we skip arbitration. `chosen_by='consensus'`. We pick the fuller reasoning (owl's) as the published one.

### Budget
Per call:
- Agreement path (~70% of calls): 2 LLM calls ≈ 2k in / 800 out tokens. ~$0.003.
- Disagreement path: 3 LLM calls ≈ 3.5k in / 1.2k out tokens. ~$0.012.
- 96 scans/day × 6 candidates × 30% disagreement rate ≈ 576 agreement calls + 172 disagreement calls = ~$3.80/day worst case.

This breaks the $1/day ceiling. Two levers:
1. **Skip hawk** on candidates with safety_score < 5 (we use the heuristic as a pre-filter — don't even spend tokens on garbage).
2. **Cap scans to 3 candidates during the sprint** (6 was a comfort number). Gets us to ~$1.50/day, within 50% overage; acceptable for 3 days.

If we're still bleeding: switch arbiter to Haiku 4.5. Lose some nuance, stay under budget.

## Streaming

### Live duel page (homepage when a scan is active)
- Server route `/api/duel/stream` → Server-Sent Events.
- While a scan is running, each snapshot emits:
  - `start { tokenSymbol, address, candidateIndex, totalCandidates }`
  - `hawk_delta { text }` / `owl_delta { text }` interleaved as tokens arrive
  - `hawk_done { decision }` / `owl_done { decision }`
  - `arbiter_delta { text }` (if disagreed)
  - `resolved { callId, chosen_by }`
- Frontend renders two typewriter columns using framer-motion (no fake `setTimeout` — real streamed text).
- When no scan is in-flight, homepage shows the most recent completed duel as a replay loop.

### Per-call replay
`/duel/[id]`: fetches stored `hawk_decision.reasoning` and `owl_decision.reasoning`, replays them as typewriter at ~60 chars/sec. Pausable. Scrubbable timeline.

## Birdeye usage

Same as before — 7 working endpoints on free tier. `token_security` and `multi_price` are blocked; we work around with the heuristic safety score and serial price polling.

New endpoint use for the Duel:
- **Owl's deployer check**: we derive a token's deployer wallet from `/defi/txs/token` (oldest swaps → trace the LP creator). Then cross-reference that wallet against a Supabase-local table of "deployer_history" we build up over time. No new Birdeye endpoint, just richer mining of the existing ones.

## Heuristic safety score (unchanged)

See `lib/birdeye.ts#heuristicSafety` — holder concentration, liquidity, age, holder count, volume/liquidity ratio. Score 0–10. Pre-filter: snap safety <3 = skip, don't burn tokens on it.

## Frontend

### Key pages
- `/` — **Feed + live duel inset.** Hero stats on top. Below: live-duel panel (two streaming columns) if scan active, otherwise the most recent disagreed call replaying. Below that: feed of resolved calls.
- `/duel/[id]` — full-width two-column replay of a specific disagreement. Main viral artifact.
- `/track` — calibration chart: x-axis = conviction bucket (0-20, 20-40, ..., 80-100), y-axis = actual hit rate, one line per model + one for "resolved". Below: scrollable table of all closed calls.
- `/kills` — biggest losses, pinned, with full reasoning replay. The agent's shame gallery.
- `/calls/[id]` — per-call detail: price chart since call, reasoning, signals table, **data receipts** (endpoint name + sample response per Birdeye call used).
- `/about` — one screen. What it is, how the duel works, link to GitHub.

### Style guide (anti-AI-slop)
Unchanged from previous version — terminal-ish dark UI, Geist + Geist Mono + Space Grotesk, amber accent `#fcd34d`, up-green `#10b981`, down-red `#ef4444`, no gradients, no glassmorphism, tabular-nums everywhere, 1px borders not shadows. See the full list in the prior commit — rules still apply, just with Duel-specific additions below.

### Duel-specific UI
- Two-column layout on `/duel/[id]`: left = hawk (accent yellow border, `HAWK · haiku 4.5`), right = owl (blue-ish border `#60a5fa`, `OWL · sonnet 4.6`).
- Arbiter verdict renders as a third panel below when `disagreed == true`, with a chess-referee-style vibe: "Arbiter → Owl. Reason: deployer history made the surface flow irrelevant."
- Typewriter cursor is a single amber block, blinking at 1.2s.
- Streaming tokens animate opacity 0 → 1 over 60ms to avoid jitter.
- Final decision sticker appears at the top of each panel when that agent finishes: direction badge + conviction number in giant Geist Sans.

### Typography
- All streaming reasoning: **Geist Mono 13.5px**, line-height 1.65. Feels like reading a log.
- Final decisions: Geist Sans 24–32px tabular.
- Numbers: always tabular-nums.

### Animations (Framer Motion)
- Feed row entrance: `y: 8 → 0`, opacity, 180ms, 30ms stagger, one-time.
- New call arriving via Supabase realtime: slide in top + 600ms accent flash border.
- Duel panel live-streaming tokens: no motion on the text (real streaming is the motion). Winner sticker scales `0.95 → 1` on reveal, 220ms.
- Arbiter panel entrance: slide up from the bottom, 280ms, when disagreement resolves.
- Calibration chart: axis/lines draw in on mount, 600ms. Use `animate` on SVG `pathLength`.

### Microcopy
- "Hawk vs Owl" never appears in copy — always the model names ("haiku 4.5" / "sonnet 4.6") so it's technically legible to judges.
- Disagreements framed neutrally: "the models split." Not "AI civil war."
- Arbiter verdicts quote its own reasoning, not editorializing. Integrity signal.

## Tech stack (unchanged where not noted)

- Next.js 16.2.4, App Router, src/ dir
- TypeScript strict
- Tailwind v4 via `@theme inline` in globals.css
- Framer Motion v12
- Lucide React
- Supabase JS + realtime
- OpenRouter via `openai` SDK with base URL override, **streaming enabled**
- Models: `anthropic/claude-haiku-4.5` (hawk), `anthropic/claude-sonnet-4.6` (owl + arbiter)
- lightweight-charts v5 for per-call charts
- Recharts for the calibration chart (lightweight-charts is for OHLCV only)
- pnpm v10, Node 22

## Test gates (per phase)

Detail in `TODO.md`. High level:
- **Phase 1**: smoke scripts pass for Birdeye, LLM, Supabase. Shell renders clean at 1440/768/390.
- **Phase 2**: `run-once` writes real duel rows (both decisions persisted, disagreement flag correct).
- **Phase 3**: `/` shows feed with resolved calls. `/duel/[id]` replays. `/track` shows calibration chart. `/kills` shows losses.
- **Phase 4**: live SSE duel on homepage works end-to-end. OG image per call page.
- **Phase 5**: prod deploy, 30+ real calls backfilled, launch thread drafted.

## Risks

| Risk | Mitigation |
|---|---|
| LLM budget blows up with dual + arbiter | Safety-score pre-filter (skip candidates <3), cap to 3-6 candidates/scan, fall back to Haiku-only arbiter if daily spend > $0.80 |
| Streaming SSE hits Vercel timeout on a long scan | Scan endpoint stays as a normal JSON response; streaming only fires on dedicated `/api/duel/stream` for single-token replays. |
| Both models "agree by accident" and the Duel looks empty | Seed disagreement rate tracking: if <15% of calls disagreed after 24h, tighten the disagreement threshold (conviction gap ≥ 15 instead of 20) or add a "contrarian" instruction to one agent's system prompt. |
| Arbiter always sides with owl (Sonnet scoring Sonnet) | Monitor `chosen_by` distribution. If >70% arbiter→owl after 50 resolved disagreements, rotate to Haiku for arbiter for a week. |
| Judges think "duel" is gimmicky, not substantive | Calibration chart (`/track`) is the substance backstop — it proves which model is actually more accurate, making the duel meaningful, not theater. |

## Submission package

- **Name**: RECON
- **GitHub**: public repo, MIT
- **Live URL**: `recon-bird.vercel.app` or similar
- **X thread**: demo video of a single live duel where the models disagree, then follow with the calibration chart screenshot
- **Endpoints used**: full Birdeye list from this spec
- **Description**: 2 paragraphs, led by the one-line pitch

## Decisions locked

1. Name: **RECON**
2. Primary viral hook: the Duel
3. Backup substance hook: calibration chart on `/track`
4. No X auto-poster ($200/mo not worth it); manual launch thread from personal account
5. No Telegram bot in v1 (stretch only)
