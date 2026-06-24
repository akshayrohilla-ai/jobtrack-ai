-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Tracks which lifecycle/onboarding emails have been sent to each user, so the
-- backend can send each exactly once (idempotency for the welcome + future drip).

create table if not exists public.onboarding_emails (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  email_key text not null,                 -- e.g. 'welcome', 'activation_d1', ...
  sent_at   timestamptz not null default now(),
  unique (user_id, email_key)              -- one send per user per email
);

-- RLS on (project invariant). No policies → the public anon key gets nothing;
-- the backend uses the service-role key which bypasses RLS.
alter table public.onboarding_emails enable row level security;
