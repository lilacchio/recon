-- recon schema v2 (Duel edition) — paste into the Supabase SQL editor.
-- Idempotent: safe to re-run. Drops and recreates `calls` since schema changed materially
-- (fine to do here because the DB hasn't been populated yet — no data loss).

create table if not exists tokens (
  address       text primary key,
  symbol        text,
  name          text,
  logo_uri      text,
  decimals      int,
  first_seen_at timestamptz default now()
);

-- If an old v1 calls table exists, drop it cleanly.
drop table if exists price_snaps cascade;
drop table if exists calls       cascade;

create table calls (
  id                uuid primary key default gen_random_uuid(),
  token_address     text references tokens(address) on delete cascade,
  -- Resolved output (what the dashboard shows as "the call")
  direction         text not null check (direction in ('long','short','watch')),
  conviction        smallint not null check (conviction between 0 and 100),
  horizon           text not null check (horizon in ('1h','4h','24h','7d')),
  risk              smallint not null check (risk between 1 and 10),
  reasoning         text not null,
  -- The duel
  hawk_decision     jsonb not null,
  owl_decision      jsonb not null,
  disagreed         boolean not null default false,
  chosen_by         text not null check (chosen_by in ('hawk','owl','arbiter','consensus')),
  arbiter_reasoning text,
  -- Context
  signals           jsonb not null,
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

-- Lightweight daily LLM spend tracker for the budget guard.
create table if not exists token_usage (
  day           date primary key default current_date,
  tokens_in     bigint not null default 0,
  tokens_out    bigint not null default 0,
  est_usd       numeric not null default 0,
  updated_at    timestamptz default now()
);

create index if not exists calls_created_at_idx on calls(created_at desc);
create index if not exists calls_conviction_idx on calls(conviction desc);
create index if not exists calls_disagreed_idx  on calls(disagreed, created_at desc);
create index if not exists calls_chosen_by_idx  on calls(chosen_by);
create index if not exists calls_token_idx      on calls(token_address);
create index if not exists price_snaps_call_idx on price_snaps(call_id, taken_at desc);

-- RLS: public read, writes only via service role.
alter table tokens       enable row level security;
alter table calls        enable row level security;
alter table price_snaps  enable row level security;
alter table token_usage  enable row level security;

drop policy if exists tokens_read       on tokens;
drop policy if exists calls_read        on calls;
drop policy if exists price_snaps_read  on price_snaps;
drop policy if exists token_usage_read  on token_usage;

create policy tokens_read       on tokens       for select using (true);
create policy calls_read        on calls        for select using (true);
create policy price_snaps_read  on price_snaps  for select using (true);
create policy token_usage_read  on token_usage  for select using (true);
