# LinkedIn Start Tracking

Read-only tracker + Origami CSV intake for the LinkedIn lead-gen workflow.

This app is the visibility layer for two parallel lead-gen flows operated via Claude Code skills (in the `linkedintest` repo):

- **Origami flow** — user drops Origami CSV here on `/import`, rows land in Supabase as `source='origami', status='pending'`. Skill `linkedin-csv-qualify` picks them up, qualifies via Crispy + browser MCP, sends connect requests.
- **Autonomous flow** — user runs `linkedin-leadgen` skill in Claude Code with an ICP. Skill writes results directly to Supabase as `source='autonomous'`.

The dashboard at `/` shows the unified pipeline with realtime updates from Supabase.

## Stack
- Next.js 16 (App Router) + React 19.2
- Tailwind v4
- Supabase (Postgres + Realtime)
- Vercel deploy

## Setup
1. Copy `.env.example` to `.env.local`, fill Supabase keys.
2. Apply `db/schema.sql` in Supabase SQL Editor.
3. `npm run dev`.

## Deploy
Set the three env vars on Vercel (project settings → environment variables) — same keys as in `.env.example`. `SUPABASE_SERVICE_ROLE` is server-only, never exposed to the browser.
