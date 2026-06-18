-- Run in Supabase SQL Editor
-- Adds education + certifications columns to cv_profiles so a parsed degree
-- and credentials persist across sessions and can be threaded into Tailor CV
-- and Interview Prep (prevents false "missing qualification" flags on long CVs).
-- The backend insert is migration-order-safe: it falls back to writing without
-- these columns if they don't exist yet, so deploy order does not matter.

ALTER TABLE public.cv_profiles
  ADD COLUMN IF NOT EXISTS education      jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
