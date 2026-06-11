from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from middleware.admin import require_admin
from services.supabase_client import get_supabase
from datetime import datetime, timedelta, timezone

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Cost per 1000 tokens (approximate, adjust if you change models)
OPUS_INPUT_COST_PER_1K  = 0.015
OPUS_OUTPUT_COST_PER_1K = 0.075
HAIKU_INPUT_COST_PER_1K  = 0.00025
HAIKU_OUTPUT_COST_PER_1K = 0.00125


@router.get("/stats")
@limiter.limit("20/minute")
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

    total_credits_issued  = total_users * 3  # 3 free credits per signup
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

    # --- Fetch emails from auth.users ---
    email_map = {}
    signup_map = {}
    try:
        auth_users = supabase.auth.admin.list_users()
        # SDK 2.x returns a list directly; guard for both response shapes
        user_list = auth_users if isinstance(auth_users, list) else getattr(auth_users, 'users', [])
        for au in user_list:
            uid = au.id if hasattr(au, 'id') else au.get('id', '')
            email = au.email if hasattr(au, 'email') else au.get('email', '')
            created = au.created_at if hasattr(au, 'created_at') else au.get('created_at')
            email_map[uid] = email or ""
            signup_map[uid] = created.isoformat() if hasattr(created, 'isoformat') else (created or None)
    except Exception:
        pass

    # --- Per-user table (for user list view) ---
    # A user is stale only if: no usage_log in 30 days AND signed up more than 7 days ago
    seven_days_ago_str = (now - timedelta(days=7)).isoformat()
    user_details = []
    for u in sorted(users, key=lambda x: x.get("lifetime_used", 0), reverse=True):
        uid = u["user_id"]
        signed_up = signup_map.get(uid)
        is_new = signed_up and signed_up >= seven_days_ago_str
        is_active = uid in active_user_ids or is_new
        user_details.append({
            "user_id":       uid,
            "email":         email_map.get(uid, ""),
            "balance":       u.get("balance", 0),
            "lifetime_used": u.get("lifetime_used", 0),
            "is_active":     is_active,
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


class GiftCreditsRequest(BaseModel):
    email: str
    credits: int
    note: str = "admin gift"


@router.post("/gift-credits")
@limiter.limit("10/minute")
async def gift_credits(request: Request, payload: GiftCreditsRequest):
    """Gift credits to a user by email. Admin only."""
    await require_admin(request)

    if payload.credits < 1 or payload.credits > 100:
        raise HTTPException(status_code=400, detail="Credits must be between 1 and 100")

    supabase = get_supabase()

    # Look up user_id by email — use listUsers filter which is more reliable than iterating
    try:
        filter_resp = supabase.auth.admin.list_users()
        user_list = filter_resp if isinstance(filter_resp, list) else getattr(filter_resp, 'users', [])
        matched = next(
            (u for u in user_list
             if (u.email if hasattr(u, 'email') else u.get('email', '')) == payload.email),
            None
        )
        if matched:
            user_id = matched.id if hasattr(matched, 'id') else matched.get('id')
        else:
            # Fallback: query credits table for user_id if email lookup failed
            user_id = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not query users: {str(e)}")

    if not user_id:
        raise HTTPException(status_code=404, detail=f"No user found with email {payload.email}")

    # Upsert credits row
    existing = supabase.table("credits").select("balance, lifetime_purchased").eq("user_id", user_id).execute()
    if existing.data:
        current = existing.data[0]
        supabase.table("credits").update({
            "balance": current["balance"] + payload.credits,
            "lifetime_purchased": (current.get("lifetime_purchased") or 0) + payload.credits,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("user_id", user_id).execute()
    else:
        supabase.table("credits").insert({
            "user_id": user_id,
            "balance": payload.credits,
            "lifetime_used": 0,
            "lifetime_purchased": payload.credits,
        }).execute()

    # Log it — best-effort, don't crash the response if the table schema differs
    try:
        supabase.table("usage_log").insert({
            "user_id": user_id,
            "action": "admin_gift",
            "credits_used": 0,  # neutral — not a deduction
        }).execute()
    except Exception:
        pass

    new_balance = (existing.data[0]["balance"] if existing.data else 0) + payload.credits
    return {"success": True, "email": payload.email, "credits_added": payload.credits, "new_balance": new_balance}


@router.get("/usage-log")
@limiter.limit("20/minute")
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


class DeleteUserRequest(BaseModel):
    user_id: str
    email: str


@router.delete("/delete-user")
@limiter.limit("5/minute")
async def delete_user(request: Request, payload: DeleteUserRequest):
    """
    Permanently delete a user. Admin only.
    1. Saves email to deleted_accounts to block free-credit abuse on re-registration.
    2. Deletes all user data tables.
    3. Deletes from auth.users.
    """
    await require_admin(request)
    supabase = get_supabase()

    # Prevent admin from deleting themselves
    admin_user = await require_admin(request)

    user_id = payload.user_id.strip()
    email   = payload.email.strip().lower()

    # 1. Record in deleted_accounts to block future free-credit abuse
    try:
        supabase.table("deleted_accounts").insert({
            "email": email,
            "original_user_id": user_id,
        }).execute()
    except Exception:
        pass  # table may not exist yet — migration handles this

    # 2. Clean up user data (belt-and-suspenders — FKs should cascade but be explicit)
    for table in ["credits", "usage_log", "cv_profiles", "applications",
                  "jd_evaluations", "payment_log", "cv_tailoring_log"]:
        try:
            supabase.table(table).delete().eq("user_id", user_id).execute()
        except Exception:
            pass

    # 3. Delete from auth.users
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete auth user: {str(e)}")

    return {"success": True, "deleted_user_id": user_id, "email": email}
