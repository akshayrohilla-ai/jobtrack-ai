from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from middleware.auth import get_current_user
from services.supabase_client import get_supabase
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)

ADMIN_EMAIL = "support@jobtrackai.co.in"
FROM_EMAIL  = "noreply@jobtrackai.co.in"


async def _notify_admin_deletion(email: str, name: str, credits_remaining: int):
    """Send admin notification email via Resend when a user deletes their account."""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return  # non-fatal — log only

    body_html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;background:#F3EDE2;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;">

        <div style="text-align:center;padding-bottom:24px;">
          <img src="https://www.jobtrackai.co.in/apple-touch-icon.png" width="40" height="40"
               alt="JobTrack AI" style="border-radius:9px;display:inline-block;vertical-align:middle;" />
          <span style="font-size:17px;font-weight:700;color:#211E18;vertical-align:middle;padding-left:10px;">
            JobTrack<span style="color:#A6803C;"> AI</span></span>
        </div>

        <div style="background:#FBF7F0;border:1px solid #E2D8C6;border-radius:14px;padding:34px;">
          <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;color:#211E18;text-align:center;margin:0 0 8px;">A user deleted their account</h2>
          <p style="color:#837B6B;font-size:13px;text-align:center;margin:0 0 26px;">Here are the details so you can follow up if needed.</p>

          <div style="background:#F6F0E5;border:1px solid #E2D8C6;border-radius:10px;padding:18px 20px;margin-bottom:22px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#837B6B;font-size:12px;padding:6px 0;">Name</td>
                <td style="color:#211E18;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">{name or "—"}</td>
              </tr>
              <tr>
                <td style="color:#837B6B;font-size:12px;padding:6px 0;border-top:1px solid #E2D8C6;">Email</td>
                <td style="color:#7A2E2E;font-size:13px;font-weight:600;text-align:right;padding:6px 0;border-top:1px solid #E2D8C6;">{email}</td>
              </tr>
              <tr>
                <td style="color:#837B6B;font-size:12px;padding:6px 0;border-top:1px solid #E2D8C6;">Credits at deletion</td>
                <td style="color:#4E483D;font-size:13px;font-weight:600;text-align:right;padding:6px 0;border-top:1px solid #E2D8C6;">{credits_remaining}</td>
              </tr>
            </table>
          </div>

          <div style="background:#F2E6E2;border:1px solid #E4C9C2;border-radius:8px;padding:12px 16px;">
            <p style="color:#7A2E2E;font-size:12px;margin:0;text-align:center;">
              Their email is now blocked from receiving free credits on re-registration.
            </p>
          </div>

          <p style="color:#A99F8C;font-size:11px;text-align:center;margin:20px 0 0;line-height:1.6;">
            Automated notification from jobtrackai.co.in
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


def _welcome_html(first_name: str) -> str:
    """Welcome email in the editorial 'Verdict' brand (ivory/claret/brass, no gradients).
    Table-based + inline styles for email-client compatibility; serif heading falls back to
    Georgia (web fonts don't load in most clients); logo is a hosted PNG (SVG is stripped)."""
    hi = f"Welcome, {first_name}." if first_name else "Welcome to JobTrack AI."
    return f"""
    <div style="background:#F3EDE2;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:520px;margin:0 auto;">

        <div style="text-align:center;padding-bottom:26px;">
          <img src="https://www.jobtrackai.co.in/apple-touch-icon.png" width="40" height="40"
               alt="JobTrack AI" style="border-radius:9px;display:inline-block;vertical-align:middle;" />
          <span style="font-size:17px;font-weight:700;color:#211E18;vertical-align:middle;padding-left:10px;">
            JobTrack<span style="color:#A6803C;"> AI</span></span>
        </div>

        <div style="background:#FBF7F0;border:1px solid #E2D8C6;border-radius:14px;padding:36px 34px;">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#211E18;margin:0 0 18px;line-height:1.2;">{hi}</h1>

          <p style="font-size:15px;line-height:1.65;color:#4E483D;margin:0 0 16px;">
            You came here to stop guessing, so here's the fastest way to feel the difference: pick one
            job you're actually considering, and get the verdict before you apply.
          </p>
          <p style="font-size:15px;line-height:1.65;color:#4E483D;margin:0 0 16px;">
            Paste the job description, and in seconds you'll see an A&ndash;F fit grade, a salary read,
            the skills you match, the ones you're missing, and the red flags in the posting.
          </p>
          <p style="font-size:15px;line-height:1.65;color:#4E483D;margin:0 0 26px;">
            You have <strong style="color:#211E18;">3 free credits</strong> &mdash; no card. One verdict
            is one credit. Spend the first on a role that matters.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
            <td style="background:#7A2E2E;border-radius:9px;">
              <a href="https://www.jobtrackai.co.in" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#F3EDE2;text-decoration:none;">Get your first verdict &rarr;</a>
            </td>
          </tr></table>

          <p style="font-size:15px;line-height:1.6;color:#4E483D;margin:0;">&mdash; Team JobTrack AI</p>
        </div>

        <p style="text-align:center;font-size:11px;color:#837B6B;margin:20px 0 0;line-height:1.6;">
          You're receiving this because you created a JobTrack AI account.<br/>
          Questions? Just reply, or write to support@jobtrackai.co.in
        </p>
      </div>
    </div>
    """


@router.post("/welcome")
@limiter.limit("20/hour")
async def send_welcome_email(request: Request):
    """Send the one-time welcome email. Idempotent: safe to call on every login —
    only the first call per user actually sends (guarded by onboarding_emails)."""
    user_id = await get_current_user(request)
    supabase = get_supabase()

    # Claim the 'welcome' slot first — unique(user_id, email_key) makes this the lock.
    # If it fails (already sent, race, or table not yet created) we simply don't send.
    try:
        supabase.table("onboarding_emails").insert(
            {"user_id": user_id, "email_key": "welcome"}
        ).execute()
    except Exception:
        return {"sent": False}

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return {"sent": False}

    email = ""
    name = ""
    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        u = auth_user.user if hasattr(auth_user, 'user') else auth_user
        email = (u.email if hasattr(u, 'email') else u.get('email', '')) or ''
        meta = (u.user_metadata if hasattr(u, 'user_metadata') else u.get('user_metadata', {})) or {}
        name = meta.get('full_name', '') or ''
    except Exception:
        pass

    if not email:
        return {"sent": False}

    first = name.split(" ")[0].strip() if name else ""
    subject = f"Your 3 free credits are ready, {first}" if first else "Your 3 free credits are ready"

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": f"JobTrack AI <{FROM_EMAIL}>",
                    "to": [email],
                    "reply_to": ADMIN_EMAIL,
                    "subject": subject,
                    "html": _welcome_html(first),
                },
                timeout=10,
            )
    except Exception:
        logger.warning("welcome email send failed", exc_info=True)
        return {"sent": False}

    return {"sent": True}


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
                  "jd_evaluations", "payment_log", "cv_tailoring_log", "onboarding_emails"]:
        try:
            supabase.table(table).delete().eq("user_id", user_id).execute()
        except Exception:
            pass

    # 3. Delete auth user
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        logger.error("account deletion failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not delete account. Please contact support.")

    # 4. Notify admin (non-blocking)
    await _notify_admin_deletion(email, name, credits_remaining)

    return {"success": True}
