from fastapi import APIRouter, Request
from middleware.admin import require_admin
from services.supabase_client import get_supabase
from datetime import datetime, timedelta, timezone

router = APIRouter()

# Cost per 1000 tokens (approximate, adjust if you change models)
OPUS_INPUT_COST_PER_1K  = 0.015
OPUS_OUTPUT_COST_PER_1K = 0.075
HAIKU_INPUT_COST_PER_1K  = 0.00025
HAIKU_OUTPUT_COST_PER_1K = 0.00125


@router.get("/stats")
async def get_admin_stats(request: Request):
    """
    Master dashboard stats — users, credits, usage.
    Only accessible by admin user.
    """
    await require_admin(request)
    supabase = get_supabase()

    # --- Users ---
    users_result = supabase.table("credits").select("user_id, balance, lifetime_used, updated_at").execute()
    users = users_result.data or []

    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    # Active = used the app in last 30 days (has a usage_log entry)
    recent_usage = supabase.table("usage_log").select("user_id").gte("created_at", thirty_days_ago).execute()
    active_user_ids = set(r["user_id"] for r in (recent_usage.data or []))

    total_users    = len(users)
    active_users   = len(active_user_ids)
    stale_users    = total_users - active_users

    total_credits_issued  = total_users * 2  # 2 free credits per signup
    total_credits_used    = sum(u.get("lifetime_used", 0) for u in users)
    total_credits_remaining = sum(u.get("balance", 0) for u in users)

    # --- Usage log breakdown ---
    all_usage = supabase.table("usage_log").select("action, credits_used, created_at").execute()
    usage_rows = all_usage.data or []

    by_action = {}
    usage_last_7d = 0
    usage_last_30d = 0

    for row in usage_rows:
        action = row.get("action", "unknown")
        cost   = row.get("credits_used", 1)
        by_action[action] = by_action.get(action, 0) + cost
        if row.get("created_at", "") >= seven_days_ago:
            usage_last_7d += cost
        if row.get("created_at", "") >= thirty_days_ago:
            usage_last_30d += cost

    # --- Estimated Anthropic spend (from usage log, not live balance) ---
    # Each jd_evaluate = ~1 Opus call (~800 input + ~500 output tokens avg)
    # Each cv_parse    = ~1 Haiku call (~1200 input + ~400 output tokens avg)
    jd_evals  = by_action.get("jd_evaluate", 0)
    cv_parses = by_action.get("cv_parse", 0)

    opus_cost  = jd_evals  * ((800  * OPUS_INPUT_COST_PER_1K  / 1000) + (500 * OPUS_OUTPUT_COST_PER_1K  / 1000))
    haiku_cost = cv_parses * ((1200 * HAIKU_INPUT_COST_PER_1K / 1000) + (400 * HAIKU_OUTPUT_COST_PER_1K / 1000))
    total_estimated_cost_usd = round(opus_cost + haiku_cost, 4)

    # --- Per-user table (for user list view) ---
    user_details = []
    for u in sorted(users, key=lambda x: x.get("lifetime_used", 0), reverse=True):
        user_details.append({
            "user_id":       u["user_id"],
            "balance":       u.get("balance", 0),
            "lifetime_used": u.get("lifetime_used", 0),
            "is_active":     u["user_id"] in active_user_ids,
            "last_seen":     u.get("updated_at", "—"),
        })

    return {
        "users": {
            "total":   total_users,
            "active":  active_users,
            "stale":   stale_users,
        },
        "credits": {
            "total_issued":    total_credits_issued,
            "total_used":      total_credits_used,
            "total_remaining": total_credits_remaining,
        },
        "usage": {
            "last_7_days":  usage_last_7d,
            "last_30_days": usage_last_30d,
            "by_action":    by_action,
        },
        "estimated_spend_usd": total_estimated_cost_usd,
        "cost_note": "Estimated from usage logs. Check console.anthropic.com for exact balance.",
        "user_details": user_details,
    }


@router.get("/usage-log")
async def get_usage_log(request: Request, limit: int = 50):
    """Recent usage log entries — last N actions across all users."""
    await require_admin(request)
    supabase = get_supabase()
    result = supabase.table("usage_log") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return result.data or []
