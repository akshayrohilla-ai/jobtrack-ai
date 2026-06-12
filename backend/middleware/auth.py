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
    Atomically decrements credits and logs usage via the spend_credits RPC.
    The deduction + usage log happen in a single SQL statement, so concurrent
    requests can never spend the same credit twice (TOCTOU-safe).
    Returns the new balance. Raises 402 if balance is insufficient.
    """
    supabase = get_supabase()

    try:
        result = supabase.rpc("spend_credits", {
            "p_user": user_id,
            "p_cost": cost,
            "p_action": action,
        }).execute()
    except Exception as e:
        # The RPC raises 'insufficient_credits' when the balance is too low.
        if "insufficient_credits" in str(e):
            raise HTTPException(
                status_code=402,
                detail={
                    "message": "Insufficient credits",
                    "required": cost,
                    "upgrade_message": "Purchase a credit pack to continue.",
                }
            )
        # Unknown failure — don't leak internals.
        raise HTTPException(status_code=500, detail="Could not process credits")

    new_balance = result.data
    if new_balance is None:
        raise HTTPException(
            status_code=402,
            detail={"message": "No credit record found for this account. Please contact support."}
        )

    return new_balance


async def refund_credits(user_id: str, cost: int = 1):
    """Refunds credits on AI failure — atomic reversal via the refund_credits RPC."""
    try:
        supabase = get_supabase()
        supabase.rpc("refund_credits", {"p_user": user_id, "p_cost": cost}).execute()
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
