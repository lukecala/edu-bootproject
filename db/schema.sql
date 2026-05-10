-- LinkedIn Start Tracking — Supabase schema (simplified)
-- Apply via Supabase Studio → SQL Editor → paste this entire file → Run.
-- Drops the old simplified objects and recreates them. Safe to re-run; tables expected empty.

-- ---------- extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- drop old objects ----------
drop view  if exists public.leads_tracker;
drop table if exists public.leads;
drop type  if exists lead_status   cascade;
drop type  if exists first_message cascade;
drop type  if exists lead_source   cascade;

-- ---------- enums ----------
create type lead_status   as enum ('connection_sent', 'new', 'connected', 'rejected');
create type first_message as enum ('message_sent', 'replied');
create type lead_source   as enum ('origami', 'monitor_manual');

-- ---------- updated_at trigger fn ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- icp ----------
-- single active row at a time. The app shows the onboarding modal until a row exists.
create table if not exists public.icp (
  id              uuid primary key default uuid_generate_v4(),
  role            text,
  industry        text,
  company_size    text,
  geography       text,
  signal          text,
  disqualification text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- safe-add for existing icp tables (idempotent)
alter table public.icp add column if not exists disqualification text;

drop trigger if exists icp_updated_at on public.icp;
create trigger icp_updated_at before update on public.icp
  for each row execute function public.set_updated_at();

-- ---------- leads ----------
create table public.leads (
  id                uuid primary key default uuid_generate_v4(),
  linkedin_url      text not null unique,
  source            lead_source   not null,
  status            lead_status   not null default 'new',
  first_message     first_message,
  last_activity_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index leads_status_idx     on public.leads(status);
create index leads_source_idx     on public.leads(source);
create index leads_created_at_idx on public.leads(created_at desc);

create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.icp   enable row level security;
alter table public.leads enable row level security;

-- anon: read-only on leads (the dashboard subscribes via anon_key for realtime)
drop policy if exists "anon read leads" on public.leads;
create policy "anon read leads" on public.leads
  for select to anon using (true);

-- ICP: no anon policy → service_role only.
-- Inline edits to leads and ICP create go through Next.js server actions using SUPABASE_SERVICE_ROLE.
