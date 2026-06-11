from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from middleware.auth import get_current_user
from services.supabase_client import get_supabase
import httpx
import os

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ADMIN_EMAIL = "support@jobtrackai.co.in"
FROM_EMAIL  = "noreply@jobtrackai.co.in"


async def _notify_admin_deletion(email: str, name: str, credits_remaining: int):
    """Send admin notification email via Resend when a user deletes their account."""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return  # non-fatal — log only

    body_html = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0A1628;padding:40px 16px;min-height:100vh;">
      <div style="max-width:520px;margin:0 auto;">

        <!-- Logo -->
        <div style="text-align:center;padding-bottom:28px;">
          <table cellpadding="0" cellspacing="0" style="display:inline-table;">
            <tr>
              <td style="background:linear-gradient(135deg,#1B6FEB,#0EA5E9);border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                <span style="color:white;font-size:18px;font-weight:700;line-height:40px;display:block;">J</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <div style="color:white;font-size:18px;font-weight:700;">JobTrack<span style="color:#60AFFF;">AI</span></div>
                <div style="color:rgba(255,255,255,0.35);font-size:9px;letter-spacing:1px;text-transform:uppercase;">YOUR AI CAREER COPILOT</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Card -->
        <div style="background:#0F1E35;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:36px;">

          <!-- Icon -->
          <div style="text-align:center;margin-bottom:20px;">
            <div style="width:56px;height:56px;background:rgba(220,53,69,0.12);border-radius:50%;border:1px solid rgba(220,53,69,0.25);text-align:center;line-height:56px;font-size:24px;display:inline-block;">&#128546;</div>
          </div>

          <h2 style="color:white;font-size:20px;font-weight:700;text-align:center;margin:0 0 8px;">A user deleted their account</h2>
          <p style="color:rgba(255,255,255,0.45);font-size:13px;text-align:center;margin:0 0 28px;">Here are the details so you can follow up if needed.</p>

          <!-- Details -->
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:20px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding:6px 0;">Name</td>
                <td style="color:white;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">{name or "—"}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">Email</td>
                <td style="color:#60AFFF;font-size:13px;font-weight:600;text-align:right;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">{email}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">Credits at deletion</td>
                <td style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;text-align:right;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">{credits_remaining}</td>
              </tr>
            </table>
          </div>

          <!-- Note -->
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px 16px;">
            <p style="color:#FCD34D;font-size:12px;margin:0;text-align:center;">
              &#9888; Their email is now blocked from receiving free credits on re-registration.
            </p>
          </div>

          <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin:20px 0 0;line-height:1.6;">
            This is an automated notification from jobtrackai.co.in
          </p>
        </div>
      </div>
    </div>
    """

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": f"JobTrack AI <{FROM_EMAIL}>",
                    "to": [ADMIN_EMAIL],
                    "subject": f"User deleted their account — {email}",
                    "html": body_html,
                },
                timeout=10,
            )
    except Exception:
        pass  # non-fatal


@router.delete("/delete-account")
@limiter.limit("3/hour")
async def delete_own_account(request: Request):
    """
    Authenticated user deletes their own account.
    Cleans up all data, blocks free-credit re-registration, notifies admin.
    """
    user_id = await get_current_user(request)
    supabase = get_supabase()

    # Fetch email + name for the notification
    email = ""
    name = ""
    credits_remaining = 0
    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        u = auth_user.user if hasattr(auth_user, 'user') else auth_user
        email = (u.email if hasattr(u, 'email') else u.get('email', '')) or ''
        meta = (u.user_metadata if hasattr(u, 'user_metadata') else u.get('user_metadata', {})) or {}
        name = meta.get('full_name', '')
    except Exception:
        pass

    try:
        credits_row = supabase.table("credits").select("balance").eq("user_id", user_id).single().execute()
        credits_remaining = credits_row.data.get("balance", 0) if credits_row.data else 0
    except Exception:
        pass

    # 1. Record in deleted_accounts to block free-credit abuse
    if email:
        try:
            supabase.table("deleted_accounts").insert({
                "email": email.lower(),
                "original_user_id": user_id,
            }).execute()
        except Exception:
            pass

    # 2. Delete all user data
    for table in ["credits", "usage_log", "cv_profiles", "applications",
                  "jd_evaluations", "payment_log", "cv_tailoring_log"]:
        try:
            supabase.table(table).delete().eq("user_id", user_id).execute()
        except Exception:
            pass

    # 3. Delete auth user
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")

    # 4. Notify admin (non-blocking)
    await _notify_admin_deletion(email, name, credits_remaining)

    return {"success": True}
