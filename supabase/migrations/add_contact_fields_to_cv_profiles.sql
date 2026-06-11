-- Run in Supabase SQL Editor
-- Adds email, phone, linkedin columns to cv_profiles table

ALTER TABLE public.cv_profiles
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS phone    text,
  ADD COLUMN IF NOT EXISTS linkedin text;
