from fastapi import Request, HTTPException
from middleware.auth import get_current_user

ADMIN_USER_ID = "56adc198-81e7-4036-aacd-d0ee22de16cc"

async def require_admin(request: Request) -> str:
    """
    Verifies JWT AND checks that the user is the hardcoded admin.
    Returns user_id if admin, raises 403 for everyone else.
    """
    user_id = await get_current_user(request)
    if user_id != ADMIN_USER_ID:
        # Intentionally vague — don't reveal that an admin route exists
        raise HTTPException(status_code=403, detail="Not found")
    return user_id
