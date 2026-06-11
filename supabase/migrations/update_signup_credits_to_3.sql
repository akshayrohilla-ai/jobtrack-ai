-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Updates the on-signup credit grant from 2 to 3 credits

-- Step 1: Update the trigger function that fires on new user signup
-- Find the existing function first — name may vary. Common names: handle_new_user, on_auth_user_created
-- Replace the balance value from 2 to 3:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.credits (user_id, balance, lifetime_used, lifetime_purchased)
  VALUES (NEW.id, 3, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 2: Verify the trigger exists (read-only check)
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname ILIKE '%new_user%' OR tgname ILIKE '%signup%';

-- Step 3 (optional): Grant 1 extra credit to all existing users who signed up with 2
-- Run this ONLY ONCE — it tops up users still sitting at exactly 2 credits (haven't used any yet)
-- UPDATE public.credits SET balance = 3, lifetime_purchased = 3 WHERE balance = 2 AND lifetime_used = 0;
