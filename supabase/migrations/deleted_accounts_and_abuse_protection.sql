-- 1. Track deleted accounts to prevent free-credit abuse on re-registration
CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL,
  original_user_id  uuid,
  deleted_at        timestamptz DEFAULT now()
);

-- Index for fast lookup on signup
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON public.deleted_accounts(email);

-- RLS: only service role can read/write (backend only)
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Update handle_new_user trigger to grant 0 credits if email was previously deleted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  free_credits integer := 3;
BEGIN
  -- Check if this email was previously deleted (abuse prevention)
  IF EXISTS (
    SELECT 1 FROM public.deleted_accounts
    WHERE email = lower(NEW.email)
  ) THEN
    free_credits := 0;
  END IF;

  INSERT INTO public.credits (user_id, balance, lifetime_used, lifetime_purchased)
  VALUES (NEW.id, free_credits, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached (re-create if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
