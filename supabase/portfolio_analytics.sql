-- Apply to a NEW, dedicated Supabase project for portfolio analytics.
-- No anonymous or authenticated client access: functions use service-role credentials only.
create table if not exists public.portfolio_events (
 id bigint generated always as identity primary key,
 session_id text not null check (length(session_id)=64),
 type text not null check (type in ('page_view','resume_click','contact_click','social_click')),
 page text not null,
 project text,
 source text,
 target text,
 created_at timestamptz not null default now()
);
create index if not exists portfolio_events_created_at_idx on public.portfolio_events(created_at desc);
create index if not exists portfolio_events_session_idx on public.portfolio_events(session_id,created_at);
create table if not exists public.portfolio_notifications (
 session_id text primary key,
 created_at timestamptz not null default now()
);
alter table public.portfolio_events enable row level security;
alter table public.portfolio_notifications enable row level security;
revoke all on public.portfolio_events from anon,authenticated;
revoke all on public.portfolio_notifications from anon,authenticated;
-- Privacy: run daily via Supabase Cron (pg_cron) or a scheduled secure server job:
-- delete from public.portfolio_events where created_at < now() - interval '30 days';
-- delete from public.portfolio_notifications where created_at < now() - interval '30 days';
