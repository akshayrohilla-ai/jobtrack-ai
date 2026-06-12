import hmac
import hashlib
import razorpay
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from services.supabase_client import get_supabase
from middleware.auth import get_current_user, get_credit_balance

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)

CREDIT_PACKS = {
    "pack_10": {"credits": 10, "amount_paise": 19900, "label": "10 Credits — ₹199"},
    "pack_30": {"credits": 30, "amount_paise": 49900, "label": "30 Credits — ₹499"},
}


def _razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    return razorpay.Client(auth=(key_id, key_secret))


class CreateOrderRequest(BaseModel):
    pack_id: str  # "pack_10" or "pack_30"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    pack_id: str


@router.get("/packs")
@limiter.limit("20/minute")
async def get_packs(request: Request):
    """Return available credit packs — public, no auth needed."""
    return [
        {"id": k, **{kk: vv for kk, vv in v.items() if kk != "amount_paise"},
         "amount_inr": v["amount_paise"] // 100}
        for k, v in CREDIT_PACKS.items()
    ]


@router.post("/create-order")
@limiter.limit("5/minute")
async def create_order(request: Request, payload: CreateOrderRequest):
    user_id = await get_current_user(request)

    pack = CREDIT_PACKS.get(payload.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack_id")

    client = _razorpay_client()
    order = client.order.create({
        "amount": pack["amount_paise"],
        "currency": "INR",
        "receipt": f"{user_id[:8]}_{payload.pack_id}",
        "notes": {
            "user_id": user_id,
            "pack_id": payload.pack_id,
            "credits": pack["credits"],
        },
    })

    return {
        "order_id": order["id"],
        "amount": pack["amount_paise"],
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
        "pack": pack,
    }


@router.post("/verify-payment")
@limiter.limit("5/minute")
async def verify_payment(request: Request, payload: VerifyPaymentRequest):
    user_id = await get_current_user(request)

    pack = CREDIT_PACKS.get(payload.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack_id")

    # Verify Razorpay signature
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_secret:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_sig = hmac.new(
        key_secret.encode(), body.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed")

    # SECURITY: never trust the client's pack_id for how many credits to grant.
    # Read the authoritative pack/credits from the order's `notes`, which we set
    # server-side at create-order time. Otherwise a buyer could pay for pack_10
    # and replay verify-payment claiming pack_30.
    client = _razorpay_client()
    try:
        order = client.order.fetch(payload.razorpay_order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not verify order")

    notes = order.get("notes") or {}
    if notes.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Order does not belong to this user")

    server_pack_id = notes.get("pack_id")
    server_pack = CREDIT_PACKS.get(server_pack_id)
    if not server_pack:
        raise HTTPException(status_code=400, detail="Unknown pack on order")

    # Confirm the amount paid matches the pack price (defence in depth).
    if order.get("amount") != server_pack["amount_paise"]:
        raise HTTPException(status_code=400, detail="Order amount mismatch")

    credits_to_add = server_pack["credits"]
    supabase = get_supabase()

    # Idempotency is enforced by the UNIQUE constraint on razorpay_payment_id.
    # Insert the payment_log FIRST: if this payment was already processed, the
    # insert fails and we return the existing balance without double-crediting.
    try:
        supabase.table("payment_log").insert({
            "user_id": user_id,
            "pack_id": server_pack_id,
            "credits_added": credits_to_add,
            "amount_paise": server_pack["amount_paise"],
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
        }).execute()
    except Exception:
        # Duplicate payment_id (already applied) or insert failure — don't re-credit.
        balance = await get_credit_balance(user_id)
        return {"success": True, "balance": balance, "already_applied": True}

    # Credit the account atomically only after the log row is committed.
    add_result = supabase.rpc("add_purchased_credits", {
        "p_user": user_id,
        "p_credits": credits_to_add,
    }).execute()

    new_balance = add_result.data
    if new_balance is None:
        raise HTTPException(status_code=404, detail="Credit record not found")

    return {"success": True, "balance": new_balance, "credits_added": credits_to_add}
