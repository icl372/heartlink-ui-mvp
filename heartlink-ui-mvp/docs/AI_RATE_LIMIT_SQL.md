# AI Rate Limit SQL

Run this SQL manually in the Supabase SQL Editor before enabling production rate limiting.

```sql
create extension if not exists pgcrypto;

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  route text not null default 'generate-copy',
  client_key text not null,
  created_at timestamptz not null default now(),
  blocked boolean not null default false,
  reason text
);

create index if not exists ai_usage_events_client_created_idx
on public.ai_usage_events (client_key, created_at desc);

create index if not exists ai_usage_events_route_created_idx
on public.ai_usage_events (route, created_at desc);

alter table public.ai_usage_events enable row level security;

grant usage on schema public to service_role;
grant select, insert, delete on table public.ai_usage_events to service_role;

notify pgrst, 'reload schema';
```

`ai_usage_events` stores only a hashed `client_key`, route, timestamp, blocked flag, and non-sensitive limit reason. It must not store raw IP addresses, user messages, generated copy, provider responses, or keys.

Do not grant browser `anon` or `authenticated` roles access to this table. The Vercel Function is the only intended caller, using its server-only service role credential.

The current implementation does not run automated cleanup. Retention cleanup, if added later, must remain server-side and must not record additional user content.
