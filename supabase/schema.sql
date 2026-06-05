-- JobTrack AI — Supabase Schema
-- Run this in Supabase SQL Editor

-- Applications table (job seeker tracker)
create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  user_session text not null,
  job_title text not null,
  company text not null,
  location text,
  match_score integer,
  status text not null default 'applied' check (status in ('applied','interview','offer','rejected')),
  linkedin_url text,
  applied_date date default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CV profiles table
create table if not exists cv_profiles (
  id uuid default gen_random_uuid() primary key,
  user_session text not null,
  name text,
  title text,
  location text,
  years_exp text,
  seniority text,
  domain text,
  skills jsonb default '[]',
  raw_text text,
  created_at timestamptz default now()
);

-- JD analyses table (recruiter mode)
create table if not exists jd_analyses (
  id uuid default gen_random_uuid() primary key,
  user_session text not null,
  jd_text text not null,
  required_skills jsonb default '[]',
  nice_to_have jsonb default '[]',
  seniority text,
  years_exp text,
  domain text,
  summary text,
  created_at timestamptz default now()
);

-- Shortlisted candidates table (recruiter mode)
create table if not exists shortlist (
  id uuid default gen_random_uuid() primary key,
  user_session text not null,
  jd_id uuid references jd_analyses(id) on delete cascade,
  candidate_name text not null,
  candidate_title text,
  match_score integer,
  matched_skills jsonb default '[]',
  created_at timestamptz default now()
);

-- Auto-update updated_at on applications
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- Indexes
create index if not exists idx_applications_session on applications(user_session);
create index if not exists idx_cv_profiles_session on cv_profiles(user_session);
create index if not exists idx_jd_analyses_session on jd_analyses(user_session);
