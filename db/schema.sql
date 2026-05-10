-- LinkedIn Start Tracking — Supabase schema
-- Apply via Supabase Studio → SQL Editor → paste this entire file → Run.
-- Idempotent where possible; safe to re-run after edits.

-- ---------- extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- enums ----------
do $$ begin
  create type lead_status as enum (
    'pending',
    'qualified',
    'connection_sent',
    'accepted',
    'message_first_sent',
    'disqualified'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_source as enum ('origami', 'autonomous');
exception when duplicate_object then null; end $$;

-- ---------- updated_at trigger fn ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- icp ----------
-- single active row at a time. `created` flag tells the skill whether to ask the user.
create table if not exists public.icp (
  id            uuid primary key default uuid_generate_v4(),
  created       boolean not null default false,
  active        boolean not null default true,
  role          text,
  industry      text,
  company_size  text,
  geography     text,
  signal        text,
  target_count  int default 20,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists icp_updated_at on public.icp;
create trigger icp_updated_at before update on public.icp
  for each row execute function public.set_updated_at();

-- ---------- leads ----------
create table if not exists public.leads (
  id                    uuid primary key default uuid_generate_v4(),
  full_name             text not null,
  linkedin_url          text not null unique,
  source                lead_source not null,
  status                lead_status not null default 'pending',

  -- quality scoring (filled by the skill during qualification)
  score                 int,
  has_photo             boolean,
  has_banner            boolean,
  has_activity          boolean,

  -- audit / context
  disqualified_reason   text,
  notes                 text,

  -- timestamps for funnel analytics
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  processed_at          timestamptz,
  connected_at          timestamptz,
  message_sent_at       timestamptz
);

create index if not exists leads_status_idx     on public.leads(status);
create index if not exists leads_source_idx     on public.leads(source);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.icp   enable row level security;
alter table public.leads enable row level security;

-- anon: read-only on leads (the dashboard uses anon_key in the browser)
drop policy if exists "anon read leads" on public.leads;
create policy "anon read leads" on public.leads
  for select to anon using (true);

-- anon: NO access to icp (ICP is sensitive client config; only service_role reads/writes it)
-- nothing to grant — RLS is on, no policy = denied for anon.

-- service_role automatically bypasses RLS, so:
--   - Vercel server actions (/import) use service_role to INSERT into leads
--   - Claude Code skills use service_role to SELECT pending, UPDATE status, INSERT autonomous leads, read/write icp.

-- ---------- helper view for the dashboard ----------
-- minimal projection used by the / page
create or replace view public.leads_tracker as
  select
    id,
    full_name,
    linkedin_url,
    source,
    status,
    score,
    created_at,
    connected_at
  from public.leads
  order by created_at desc;

grant select on public.leads_tracker to anon;
