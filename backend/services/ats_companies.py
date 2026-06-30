"""
Curated registry of companies whose career pages run on a public-API ATS
(Greenhouse / Lever / Ashby). Each token below was VERIFIED against the live
API (returned >0 jobs) on 2026-06-30. This is the seed for the "direct from
company career pages" job source. [[project-job-search]]

Adding a company later = one line here, after confirming its token returns jobs:
  - Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
  - Lever:      https://api.lever.co/v0/postings/{token}?mode=json
  - Ashby:      https://api.ashbyhq.com/posting-api/job-board/{token}

`ats` is one of: "greenhouse" | "lever" | "ashby". `token` is the board slug.
"""

ATS_COMPANIES = [
    # ---- Greenhouse ----
    {"name": "Databricks", "ats": "greenhouse", "token": "databricks"},
    {"name": "Stripe", "ats": "greenhouse", "token": "stripe"},
    {"name": "Datadog", "ats": "greenhouse", "token": "datadog"},
    {"name": "MongoDB", "ats": "greenhouse", "token": "mongodb"},
    {"name": "Anthropic", "ats": "greenhouse", "token": "anthropic"},
    {"name": "Samsara", "ats": "greenhouse", "token": "samsara"},
    {"name": "Brex", "ats": "greenhouse", "token": "brex"},
    {"name": "Cloudflare", "ats": "greenhouse", "token": "cloudflare"},
    {"name": "Elastic", "ats": "greenhouse", "token": "elastic"},
    {"name": "Pinterest", "ats": "greenhouse", "token": "pinterest"},
    {"name": "Reddit", "ats": "greenhouse", "token": "reddit"},
    {"name": "Scale AI", "ats": "greenhouse", "token": "scaleai"},
    {"name": "Figma", "ats": "greenhouse", "token": "figma"},
    {"name": "Affirm", "ats": "greenhouse", "token": "affirm"},
    {"name": "Instacart", "ats": "greenhouse", "token": "instacart"},
    {"name": "Twilio", "ats": "greenhouse", "token": "twilio"},
    {"name": "Lyft", "ats": "greenhouse", "token": "lyft"},
    {"name": "Asana", "ats": "greenhouse", "token": "asana"},
    {"name": "GitLab", "ats": "greenhouse", "token": "gitlab"},
    {"name": "Robinhood", "ats": "greenhouse", "token": "robinhood"},
    {"name": "Coinbase", "ats": "greenhouse", "token": "coinbase"},
    {"name": "Postman", "ats": "greenhouse", "token": "postman"},
    {"name": "Gusto", "ats": "greenhouse", "token": "gusto"},
    {"name": "Slice", "ats": "greenhouse", "token": "slice"},
    {"name": "Vercel", "ats": "greenhouse", "token": "vercel"},
    {"name": "Monzo", "ats": "greenhouse", "token": "monzo"},
    {"name": "Chime", "ats": "greenhouse", "token": "chime"},
    {"name": "Discord", "ats": "greenhouse", "token": "discord"},
    {"name": "PhonePe", "ats": "greenhouse", "token": "phonepe"},
    {"name": "Dropbox", "ats": "greenhouse", "token": "dropbox"},
    {"name": "Mixpanel", "ats": "greenhouse", "token": "mixpanel"},
    {"name": "Airtable", "ats": "greenhouse", "token": "airtable"},
    {"name": "Groww", "ats": "greenhouse", "token": "groww"},
    # ---- Ashby ----
    {"name": "OpenAI", "ats": "ashby", "token": "openai"},
    {"name": "Snowflake", "ats": "ashby", "token": "snowflake"},
    {"name": "Deliveroo", "ats": "ashby", "token": "deliveroo"},
    {"name": "Notion", "ats": "ashby", "token": "notion"},
    {"name": "Cohere", "ats": "ashby", "token": "cohere"},
    {"name": "Ramp", "ats": "ashby", "token": "ramp"},
    {"name": "Plaid", "ats": "ashby", "token": "plaid"},
    {"name": "Nubank", "ats": "ashby", "token": "nubank"},
    {"name": "Replit", "ats": "ashby", "token": "replit"},
    {"name": "Supabase", "ats": "ashby", "token": "supabase"},
    {"name": "Confluent", "ats": "ashby", "token": "confluent"},
    {"name": "Benchling", "ats": "ashby", "token": "benchling"},
    {"name": "Linear", "ats": "ashby", "token": "linear"},
    {"name": "Render", "ats": "ashby", "token": "render"},
    {"name": "PostHog", "ats": "ashby", "token": "posthog"},
    {"name": "Navi", "ats": "ashby", "token": "navi"},
    {"name": "Atlan", "ats": "ashby", "token": "atlan"},
    {"name": "Amplitude", "ats": "ashby", "token": "amplitude"},
    # ---- Lever ----
    {"name": "Paytm", "ats": "lever", "token": "paytm"},
    {"name": "Meesho", "ats": "lever", "token": "meesho"},
    {"name": "Mindtickle", "ats": "lever", "token": "mindtickle"},
    {"name": "Porter", "ats": "lever", "token": "porter"},
    {"name": "Zeta", "ats": "lever", "token": "zeta"},
    {"name": "CRED", "ats": "lever", "token": "cred"},
    {"name": "FamPay", "ats": "lever", "token": "fampay"},
    {"name": "Fi (epiFi)", "ats": "lever", "token": "epifi"},
    # ---- Added 2026-06-30 (round 2 — India-focused + India-GCC SaaS) ----
    {"name": "Okta", "ats": "greenhouse", "token": "okta"},
    {"name": "Intercom", "ats": "greenhouse", "token": "intercom"},
    {"name": "Fivetran", "ats": "greenhouse", "token": "fivetran"},
    {"name": "New Relic", "ats": "greenhouse", "token": "newrelic"},
    {"name": "Fastly", "ats": "greenhouse", "token": "fastly"},
    {"name": "LaunchDarkly", "ats": "greenhouse", "token": "launchdarkly"},
    {"name": "CockroachDB", "ats": "greenhouse", "token": "cockroachlabs"},
    {"name": "PagerDuty", "ats": "greenhouse", "token": "pagerduty"},
    {"name": "Starburst", "ats": "greenhouse", "token": "starburst"},
    {"name": "Observe.AI", "ats": "greenhouse", "token": "observeai"},
    {"name": "PlanetScale", "ats": "greenhouse", "token": "planetscale"},
    {"name": "ClickHouse", "ats": "ashby", "token": "clickhouse"},
    {"name": "Redis", "ats": "ashby", "token": "redis"},
    {"name": "Sarvam AI", "ats": "ashby", "token": "sarvam"},
    {"name": "Temporal", "ats": "ashby", "token": "temporal"},
    {"name": "Sentry", "ats": "ashby", "token": "sentry"},
    {"name": "Miro", "ats": "ashby", "token": "miro"},
    {"name": "Ditto", "ats": "ashby", "token": "ditto"},
    {"name": "Airbyte", "ats": "ashby", "token": "airbyte"},
    {"name": "Neon", "ats": "ashby", "token": "neon"},
]
