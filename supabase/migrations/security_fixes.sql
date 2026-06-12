-- ============================================================
-- SECURITY FIXES — run this in the Supabase SQL Editor
-- Covers:
--   #2  Enable RLS on all user-data tables (lock out the public anon key)
--   #3  Atomic credit operations (spend / refund / add) to kill the
--       read-then-write race condition
-- ============================================================

-- ------------------------------------------------------------
-- #2  ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- The backend uses the SERVICE ROLE key, which BYPASSES RLS, so every
-- existing backend query keeps working untouched. The frontend never
-- queries tables directly (it only uses Supabase for auth), so enabling
-- RLS with NO anon/authenticated policy simply denies the public key.
-- That is exactly what we want: the public anon key can read/write nothing.

alter table if exists credits          enable row level security;
alter table if exists usage_log        enable row level security;
alter table if exists cv_profiles      enable row level security;
alter table if exists applications     enable row level security;
alter table if exists jd_evaluations   enable row level security;
alter table if exists cv_tailoring_log enable row level security;
-- Legacy / recruiter-mode tables (if present)
alter table if exists jd_analyses      enable row level security;
alter table if exists shortlist        enable row level security;
-- payment_log and deleted_accounts already have RLS enabled in earlier migrations.

-- ------------------------------------------------------------
-- #3  ATOMIC CREDIT OPERATIONS
-- ------------------------------------------------------------
-- These run as a single UPDATE ... WHERE balance >= cost statement, so
-- concurrent requests can never spend the same credit twice (TOCTOU fix).
--
-- SECURITY: these are SECURITY DEFINER (they bypass RLS to touch credits/
-- usage_log). We REVOKE execute from anon + authenticated and grant ONLY to
-- service_role, so they can never be invoked via the public anon key.

-- Spend credits atomically + log usage. Raises 'insufficient_credits' if short.
create or replace function spend_credits(p_user uuid, p_cost int, p_action text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal int;
begin
  update credits
     set balance       = balance - p_cost,
         lifetime_used  = coalesce(lifetime_used, 0) + p_cost,
         updated_at     = now()
   where user_id = p_user
     and balance >= p_cost
  returning balance into new_bal;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into usage_log (user_id, action, credits_used)
  values (p_user, p_action, p_cost);

  return new_bal;
end;
$$;

-- Refund credits atomically (best-effort reversal on AI failure).
create or replace function refund_credits(p_user uuid, p_cost int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal int;
begin
  update credits
     set balance       = balance + p_cost,
         lifetime_used  = greatest(0, coalesce(lifetime_used, 0) - p_cost),
         updated_at     = now()
   where user_id = p_user
  returning balance into new_bal;
  return new_bal;  -- null if no row, caller treats as best-effort
end;
$$;

-- Add purchased credits atomically (payments + admin gift).
create or replace function add_purchased_credits(p_user uuid, p_credits int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal int;
begin
  update credits
     set balance             = balance + p_credits,
         lifetime_purchased  = coalesce(lifetime_purchased, 0) + p_credits,
         updated_at          = now()
   where user_id = p_user
  returning balance into new_bal;
  return new_bal;  -- null if no credits row exists for the user
end;
$$;

-- Lock down execution: only the backend (service_role) may call these.
revoke execute on function spend_credits(uuid, int, text)      from public, anon, authenticated;
revoke execute on function refund_credits(uuid, int)           from public, anon, authenticated;
revoke execute on function add_purchased_credits(uuid, int)    from public, anon, authenticated;

grant execute on function spend_credits(uuid, int, text)       to service_role;
grant execute on function refund_credits(uuid, int)            to service_role;
grant execute on function add_purchased_credits(uuid, int)     to service_role;
