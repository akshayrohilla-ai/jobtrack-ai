# Google Sign-In (OAuth) — setup reference

> How "Continue with Google" is wired for JobTrack AI. Migrated 2026-06-23 off a company
> Google Cloud project onto its own project, with no personal info exposed on the consent screen.

## Where it lives
- **Google Cloud project:** `Job-tracker-AI` (the app's own project — *not* any company project).
- **Supabase project ref:** `ffgnwvwwsgwcbxxzjswi`.
- Google login is configured in **Supabase → Authentication → Providers → Google** using a Client
  ID + Secret from the `Job-tracker-AI` Google Cloud project.

## OAuth consent screen (Google Auth Platform → Branding / Audience)
- **App name:** `JobTrack AI`
- **User support email (shown to users):** `jobtrackai-support@googlegroups.com` — a Google Group
  owned by the founder account. **Deliberately not a personal Gmail** (keeps the owner
  pseudonymous; public-facing identity is "Bharti").
- **Developer contact (private, Google notices only):** `support@jobtrackai.co.in`
- **User type:** External · **Publishing status:** **In production**
- **Scopes:** basic only (email, profile, openid) → **no Google verification required**.

## OAuth Client (APIs & Services → Credentials, in Job-tracker-AI)
- **Type:** Web application
- **Authorized JavaScript origins:**
  - `https://www.jobtrackai.co.in`
  - `https://ffgnwvwwsgwcbxxzjswi.supabase.co`
- **Authorized redirect URI (must match Supabase callback exactly):**
  - `https://ffgnwvwwsgwcbxxzjswi.supabase.co/auth/v1/callback`
- **Client ID / Secret:** stored only in the Supabase Google provider settings. The secret is a
  credential — **never commit it** or paste it anywhere public. (Client ID is not secret but isn't
  needed in the repo.)

## Intentionally deferred (do NOT enable casually)
Adding any of these flips the app into a **brand-verification review** (multi-day), so they're left
off until it's worth one verification round:
- **App logo** on the consent screen.
- **App domain links** (home page / privacy / terms) — these also require `jobtrackai.co.in` to be
  a **verified domain in Google Search Console** first.
- The "⚠️ Verify branding" prompt in the console is expected and **safe to ignore** while there's
  no logo — the text app name "JobTrack AI" shows to users without verification, and login works.

To enable later: verify `jobtrackai.co.in` in Search Console → add it under Authorized domains →
re-add the logo + the three domain links → submit for brand verification once, together.

## Gotchas / lessons
- **Must be in "In production," not "Testing."** Testing mode caps logins to manually-added test
  users (100 max) — real signups get "access blocked." Production + basic scopes = open, no review.
- **redirect_uri_mismatch** at login = the Authorized redirect URI doesn't byte-match the Supabase
  callback. Copy the callback from Supabase (Authentication → Providers → Google) — exact, no
  trailing slash.
- The `…supabase.co` project URL appearing anywhere is **not a secret** (it's already public in the
  frontend bundle); replacing it on the consent screen is cosmetic, needs a Supabase custom domain.
