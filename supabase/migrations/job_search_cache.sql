-- ============================================================
-- JOB SEARCH CACHE — run this in the Supabase SQL Editor
-- ============================================================
-- A shared, short-lived (TTL) cache for results from the external job-search
-- API (Adzuna). This is NOT user data: each row is a normalized search key
-- mapped to a JSON payload of normalized job cards. Caching lets the free-tier
-- API budget stretch across users — identical searches within the TTL window
-- cost zero API calls. The backend also purges expired rows on each miss, so
-- the table stays permanently small (well within the Supabase free tier).
--
-- SECURITY: RLS is enabled with NO policy. The backend uses the SERVICE ROLE
-- key (which BYPASSES RLS), so it can read/write freely. The public anon key
-- gets nothing — consistent with every other user table.

create table if not exists job_search_cache (
    cache_key   text primary key,
    payload     jsonb       not null,
    expires_at  timestamptz not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_job_search_cache_expires
    on job_search_cache (expires_at);

alter table if exists job_search_cache enable row level security;
-- No policies => public anon/authenticated keys can read/write nothing.
