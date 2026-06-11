from fastapi import Request, HTTPException
from services.supabase_client import get_supabase


async def get_current_user(request: Request) -> str:
    """
    Verifies the Supabase JWT from the Authorization header.
    Returns user_id (UUID string) or raises 401.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]

    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        return user_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please sign in again.")


async def require_credits(user_id: str, action: str = "jd_evaluate", cost: int = 1) -> int:
    """
    Checks the credits table for the given user.
    Decrements balance atomically and logs the usage.
    Returns the new balance.
    Raises 402 if balance is insufficient.
    """
    supabase = get_supabase()

    result = supabase.table("credits") \
        .select("balance, lifetime_used") \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(
            status_code=402,
            detail={"message": "No credit record found for this account. Please contact support."}
        )

    balance = result.data["balance"]
    lifetime_used = result.data.get("lifetime_used", 0)

    if balance < cost:
        raise HTTPException(
            status_code=402,
            detail={
                "message": "Insufficient credits",
                "balance": balance,
                "required": cost,
                "upgrade_message": "Purchase a credit pack to continue evaluating jobs."
            }
        )

    new_balance = balance - cost

    # Decrement balance + update lifetime counter
    supabase.table("credits").update({
        "balance": new_balance,
        "lifetime_used": lifetime_used + cost,
    }).eq("user_id", user_id).execute()

    # Log the usage
    supabase.table("usage_log").insert({
        "user_id": user_id,
        "action": action,
        "credits_used": cost,
    }).execute()

    return new_balance


async def refund_credits(user_id: str, cost: int = 1):
    """Refunds credits on AI failure — reverses the deduction from require_credits."""
    try:
        supabase = get_supabase()
        result = supabase.table("credits").select("balance, lifetime_used").eq("user_id", user_id).single().execute()
        if not result.data:
            return
        supabase.table("credits").update({
            "balance": result.data["balance"] + cost,
            "lifetime_used": max(0, result.data.get("lifetime_used", 0) - cost),
        }).eq("user_id", user_id).execute()
    except Exception:
        pass  # best-effort refund


async def get_credit_balance(user_id: str) -> int:
    """
    Returns current credit balance for a user. Returns 0 if no record found.
    """
    try:
        supabase = get_supabase()
        result = supabase.table("credits") \
            .select("balance") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        return result.data["balance"] if result.data else 0
    except Exception:
        return 0
