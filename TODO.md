# RECON — TODO

Phased build plan. Every phase has a **test gate**. Don't move to the next phase until the gate is green.

Sprint deadline: April 25, 2026. Today: April 22. Working window: ~3.5 days.

**Status:** Phases 0, 1, 2, 2.5, 3, 4 done. Real Supabase reads + duel replay + calibration + kills + call detail + OG cards + README + LICENSE + robots/sitemap + skeletons + global metadata all live. ~8 seeded calls in DB. Next: Phase 5 deploy + backfill to 30+ + launch content.

---

## Phase 0 — Pre-flight (today, ~30 min)

You handle these before I start coding.

- [x] Decide final project name — **RECON**
- [x] Birdeye API key
- [x] LLM key (OpenRouter instead of Anthropic direct, $1/day cap)
- [x] Supabase project + URL + anon key + service role key
- [ ] Create empty GitHub repo (private for now, flip public on day 4 before launch)
- [x] Skip X API — $200/mo not worth it. Share buttons + manual posts from personal account instead.

**Test gate:** ✅ done via curl smoke tests on April 22 — Birdeye returned 200 on 6/8 endpoints (`token_security` and `multi_price` blocked on free tier, worked around in SPEC). Supabase service role returns 200. OpenRouter Haiku 4.5 returns 200.

---

## Phase 1 — Foundations + Birdeye client (Day 1 morning)

- [x] `pnpm create next-app` — TypeScript, Tailwind v4, App Router, src/ dir, no ESLint (ships with Next 16.2.4)
- [x] Install: `framer-motion lucide-react @supabase/supabase-js zod date-fns lightweight-charts cmdk openai` (openai pkg for OpenRouter)
- [ ] ~~Install shadcn~~ — **skipped**. Our terminal aesthetic fights shadcn defaults. Styling manually; revisit only if we need `cmdk` Dialog wrapper.
- [x] Theme tokens: `globals.css` rewritten with SPEC palette (amber accent `#fcd34d`)
- [x] Fonts: Geist, Geist Mono, Space Grotesk via `next/font`
- [x] Shell: TopBar + Sidebar + StatusBar + mono-first typography (matches Stealth Terminal bar)
- [x] `lib/birdeye.ts` — typed client with token-bucket rate limiter (1050ms interval, no burst) + 429/5xx retry w/ exponential backoff.
- [x] Wrap each working endpoint: `getTrending()`, `getNewListings()`, `getTokenOverview(addr)`, `getHolderDistribution(addr)`, `getRecentTxns(addr)`, `getPrice(addr)`, `getOhlcv(addr, ...)` + `heuristicSafety()` helper replacing blocked `token_security`.
- [x] Zod schemas for each response (passthrough on txn sub-objects because Birdeye mixes string/number amounts).
- [x] `lib/supabase.ts` — `sbBrowser()` (anon) + `sbAdmin()` (service role, server-only guard).
- [x] `lib/llm.ts` — OpenRouter wrapper via `openai` SDK. `LLM_FAST`=haiku-4.5, `LLM_SMART`=sonnet-4.6, `chat()` helper returns text + token usage.
- [x] Run `supabase/schema.sql` against the Supabase project — applied via dashboard SQL editor on 2026-04-22. `Success. No rows returned.`
- [x] `scripts/smoke-birdeye.ts`, `scripts/smoke-supabase.ts`, `scripts/smoke-llm.ts`, `scripts/apply-schema.ts` written. `_env.ts` loads `.env.local`.

**Test gate (Phase 1):**
- [x] `pnpm exec tsx scripts/smoke-birdeye.ts` — 8/8 green against real key on 2026-04-22 (trending, new_listings, overview, holders, txns, price, ohlcv, safety_heur).
- [x] `pnpm exec tsx scripts/smoke-supabase.ts` — insert / read / delete all green on 2026-04-22.
- [x] `pnpm exec tsx scripts/smoke-llm.ts` — Haiku 4.5 replies "ok" in 2.6s, 13 in / 4 out tokens.
- [x] `pnpm dev` boots, `localhost:3000` shows the terminal shell, mono-first, amber accent, pulsing status dot, zero console errors at 1440×900. ✅ Playwright confirmed.
- [x] Screenshot pass at 1440 / 1024 / 768 after shell redesign. ✅ mobile-390/tablet-768/desktop-1440 all green.

---

## Phase 2 — Agent + worker (Day 1 afternoon → Day 2 morning)

- [x] `lib/agent/candidates.ts` — trending ∪ new_listings → dedupe → hard filter (min $25k liq, <14d age) → rank by liq+vol w/ new-listing boost.
- [x] Filter is baked into candidates (hard) + `runScan` (safety-score <3 skip). No separate filter.ts file needed.
- [x] `lib/agent/snapshot.ts` — per-candidate: overview + top10 holders + 1h txns + big-buy count + heuristic safety.
- [x] ~~`lib/agent/score.ts` two-tier (Haiku → Sonnet)~~ — **SUPERSEDED by Phase 2.5 Duel mechanic.** File will be rewritten around parallel dual-model scoring.
- [x] `lib/agent/prompts.ts` — versioned. Anti-AI-slop rules baked in.
- [x] `lib/agent/persist.ts` — will be rewritten in Phase 2.5 to persist both decisions + disagreement flag + arbiter reasoning.
- [x] `app/api/cron/scan/route.ts` + `app/api/cron/accuracy/route.ts` — nodejs runtime, maxDuration 300s, `CRON_SECRET` bearer guard.
- [x] `vercel.json` — scan every 15m, accuracy every 20m.
- [x] `scripts/run-once.ts`, `scripts/accuracy-once.ts` for local testing.
- [x] `tsc --noEmit` clean across all agent + lib code.

**Test gate (Phase 2):** subsumed by Phase 2.5 — we validate end-to-end with the Duel in place, not with the single-model scorer.

---

## Phase 2.5 — The Duel (Day 2, half-day add)

This is the wow-factor layer. Both models score in parallel; arbiter resolves disagreements.

- [x] **Schema migration v2**: `calls` table has `hawk_decision`, `owl_decision`, `disagreed`, `chosen_by`, `arbiter_reasoning`. `token_usage` table created for budget tracking. Applied via dashboard 2026-04-22.
- [x] `lib/llm.ts` — `chatStream()` async generator yielding `delta`/`done` events with usage. OpenRouter `stream: true` + `stream_options.include_usage`.
- [x] `lib/agent/duel.ts` — parallel hawk + owl via `Promise.all`, disagreement rule (direction differs OR `|gap|>=20`), arbiter invocation w/ `useSmartArbiter` swap, consensus path averages conviction.
- [x] `lib/agent/prompts.ts` — `ARBITER_SYSTEM` + `arbiterPayload()`. Arbiter must pick a winner; "both valid" banned.
- [x] Rewrote `lib/agent/persist.ts`: stores both decisions + flag + arbiter reasoning + updates `token_usage`. 4h dedupe preserved.
- [x] Rewrote `lib/agent/runScan.ts` step trace to emit `hawk_score`, `owl_score`, `disagreed`, `arbiter`, `resolved`, `persist`.
- [x] `scripts/run-once.ts` prints hawk/owl side-by-side + disagreement tally + `est_usd`.
- [x] **Live-stream endpoint** `app/api/duel/stream/route.ts` — SSE emitting `snapshot_ready`, `hawk_delta`, `owl_delta`, `hawk_done`, `owl_done`, `arbiter_delta`, `arbiter_done`, `resolved`. `runtime: "nodejs"`, `maxDuration: 120`.
- [x] **Budget guard** `arbiterShouldBeSmart()` — reads today's `token_usage.est_usd`, swaps arbiter to Haiku past $0.80/day.

**Test gate (Phase 2.5):** ✅ green on 2026-04-22
- `run-once.ts` wrote 3/3 rows (JitoSOL, TRUMP, MET) with both decisions populated.
- JitoSOL triggered disagreement (hawk conv=15, owl conv=35, gap=20) → arbiter picked owl, `arbiter_reasoning` populated.
- Full batch cost $0.0107 in 70.7s. Budget guard would flip to Haiku arbiter only after ~75 such runs/day.
- SSE endpoint + calibration-rate observation deferred to Phase 3 (needs >20 seeded calls anyway).

---

## Phase 3 — Dashboard + Duel UI (Day 2 afternoon → Day 3)

### Feed page (existing shell + real data)
- [x] Shell already built (layout, StatHero, Feed, sidebar, bottom nav).
- [x] Replace `src/data/mock.ts` with a real server fetch: RSC in `app/page.tsx` reads last 50 resolved calls from Supabase via `lib/feed.ts`. StatHero now pulls real aggregates.
- [x] **"live duel inset"** on the feed (`components/feed/LiveDuelInset.tsx`): replay mode ambient-typewrites the last disagreed call; live mode accepts a token address and streams hawk/owl/arbiter via `EventSource` on `/api/duel/stream`. Two 170px-tall ColumnCards side by side.
- [x] `components/CallRow.tsx` — extended with "split" badge linking to `/duel/[id]` + "via {chosenBy}" tag.
- [x] Filter UI (`components/feed/FilterBar.tsx`): conviction slider (0–100 step 5), direction buttons, chosen_by buttons, disagreed-only toggle. URL-reflected via `router.replace` + `useSearchParams`. Reset link appears when any filter is active.
- [x] Realtime new-call subscription: `sb.channel("public:calls:feed")` on INSERT → `/api/feed/item?id=` refetch → 700ms flash via `flashIds` Set.
- [ ] ~~`components/PnlCell.tsx`, `components/LiveDot.tsx`~~ — existing sparkline + LiveDot do the job. **Not needed.**

### Duel page (the viral artifact)
- [x] `app/duel/[id]/page.tsx` — two-column typewriter replay at 80 chars/s via RAF loop. Winner sticker + arbiter panel slide-up when `disagreed`. Pause / restart controls. Share button with X intent + copy-to-clipboard.

### Track record + calibration
- [x] `app/track/page.tsx` — closed-call table with sort (newest / biggest win / biggest loss) + chosen_by filter.
- [x] **Calibration chart** (Recharts): 10-wide conviction buckets, 3 lines (hawk / owl / resolved), "perfect" diagonal reference. Short calls score green when price fell.

### Kill list
- [x] `app/kills/page.tsx` — side-adjusted losses pinned as cards. Each links to `/duel/[id]`. Shows hawk + owl conviction + split icon when they disagreed.

### Per-call detail + data receipts
- [x] `app/calls/[id]/page.tsx` — resolved reasoning + hawk/owl mini-panels + lightweight-charts candles since call (entry line overlay). OHLCV fetched server-side.
- [x] **Data receipts** section: lists the three Birdeye endpoints used + 10 signals that drove the call + expandable raw JSON.

### Animations
- [x] Feed row entrance: `motion.article` y 6→0, 250ms, 30ms stagger (capped at 300ms), one-time.
- [x] Realtime new call: INSERT subscription → flash class 700ms via `flashIds` Set (see `globals.css` `@keyframes flash`).
- [x] Duel typewriter: real stored stream replayed via RAF at 80 chars/s on `/duel/[id]`; homepage inset uses real SSE on live mode, ambient RAF replay on replay mode. No fake setTimeout.
- [x] Winner sticker scale 0.9 → 1 + opacity fade, inside `AnimatePresence` on disagreement resolve.
- [x] Arbiter panel slide-up: `initial={{ opacity: 0, y: 20 }}` → `{ opacity: 1, y: 0 }` when disagreement resolves.
- [ ] Calibration chart path-draw on mount (`pathLength` animation) — Recharts doesn't expose SVG path animation cleanly; skipping as cosmetic-only.

**Test gate (Phase 3) — Playwright MCP:**
- `/` — live duel inset renders, feed row count ≥ 20 (after backfill).
- `/duel/[id]` — both columns replay, winner sticker appears, arbiter panel present if disagreed.
- `/track` — calibration chart renders with 3 lines; table sortable.
- `/kills` — at least 3 kill cards render.
- `/calls/[id]` — chart renders, data receipts expand.
- Resize to 768 and 390: duel becomes stacked (not side-by-side) below 900px. Feed and track remain usable. BottomNav gets a "duel" tab if a live one is streaming.
- Screenshots at 1440 / 1024 / 768 / 390 saved to `docs/screens/`.

---

## Phase 4 — Polish + content (Day 3 afternoon → Day 4 morning)

- [x] Hero stats real data pulled from aggregated Supabase view.
- [x] Aggregate stats banner refined: "N resolved calls · X% green · avg winner +Y% · hawk won Z / owl won W / arbiter A". (StatHero + duel summary strip)
- [x] Empty states in domain language (feed + kills + track all in voice).
- [x] Skeleton states matching real row shape (`loading.tsx` at /, /track, /kills, /duel/[id], /calls/[id]).
- [x] **OG image for `/duel/[id]`** via `next/og` `ImageResponse` — hawk/owl panels w/ winner highlight, arbiter footer. 1200×630, verified 97KB PNG.
- [x] OG image for `/calls/[id]` — token + direction badge + reasoning excerpt + big PnL. Verified 73KB PNG.
- [x] `/about` — 6-step how-it-works, model list, endpoints, honest disclaimer.
- [x] README.md with how-it-works diagram, models used, endpoint list.
- [x] LICENSE: MIT.
- [x] Robots.ts + sitemap.ts (Next 16 metadata route handlers).
- [x] Global metadata: title template, OG defaults, Twitter card defaults, `metadataBase`.

**Test gate (Phase 4) — Playwright MCP:**
- Hit `/`, `/calls/[id]`, `/track`, `/about`. All four render without console errors.
- Inspect OG image generation: navigate to `/api/og?call=<id>` and confirm it returns a valid 1200x630 PNG.
- Check accessibility: tab through the dashboard, confirm focus rings visible.
- Check console — zero errors, zero warnings.
- Final visual pass at 1440 / 1024 / 768. Save screenshots to `docs/screens/`.

---

## Phase 5 — Deploy + backfill + launch (Day 4 morning, ~4 hours)

### Deploy
- [ ] Vercel project linked to GitHub repo. Env vars set in dashboard.
- [ ] Supabase prod project (or reuse the dev one if data is fine).
- [ ] Cron schedules confirmed in `vercel.json`. Test by manually firing the cron endpoint via the Vercel UI.
- [ ] Deploy. Hit the prod URL.

### Backfill
- [ ] Run the worker manually 5–10 times (with delays) to seed the feed. Goal: 30+ real calls visible at launch with at least a few showing real PnL.

### Launch content
- [ ] Record 45-second demo video: live duel where models DISAGREE → arbiter verdict → resolved call in feed → click through to calibration chart. The disagreement moment is the hook — film one IRL or script one with a known-split token.
- [ ] Draft launch thread (7–9 tweets). Hook: "I built two AI agents that fight over every Solana token, live, on a public feed. Haiku picks fast, Sonnet thinks deep, a third model resolves disagreements. Here's what happened this week." Pin the video. Include a screenshot of the calibration chart as proof-of-substance. Tag `@birdeye_data`. Use `#BirdeyeAPI`.
- [ ] Cross-post to Farcaster, r/solana, Birdeye Discord.
- [ ] Submit on Earn before the deadline (April 25). Include: project name, GitHub link, X thread link, live URL, list of Birdeye endpoints used, brief description.

**Test gate (Phase 5) — Playwright MCP against prod:**
- Navigate to live URL → feed loads in <2s, no errors.
- Inspect: at least 20 calls visible. Aggregate stats showing real numbers.
- Click 3 random calls — detail pages all render.
- Share popover opens, text is correct, link is the prod URL not localhost.
- OG image fetches.
- Check on real mobile (your phone) — usable, not just visually correct.

---

## Daily check-ins (informal)

End of each day, post to chat:
- What shipped
- What's blocking
- What changed in the plan

I'll update SPEC.md if the plan changes mid-flight.

---

## Stretch (only after Phase 5 ships green)

- Per-model leaderboard (`/duel/leaderboard`) — lifetime win rate, avg reasoning length, conviction-calibration per model.
- Telegram bot: push any conviction-70+ call where the models disagreed.
- Public agent run log (`/agent-log`) — every Birdeye query the agent ever made, streaming.
- "Rematch" button on `/duel/[id]` — run the same snapshot again through both models (no re-fetch) to see if the decision is stable across temperature.
