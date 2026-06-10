import hmac
import hashlib
import razorpay
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from services.supabase_client import get_supabase
from middleware.auth import get_current_user, get_credit_balance

router = APIRouter()

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
async def get_packs():
    """Return available credit packs — public, no auth needed."""
    return [
        {"id": k, **{kk: vv for kk, vv in v.items() if kk != "amount_paise"},
         "amount_inr": v["amount_paise"] // 100}
        for k, v in CREDIT_PACKS.items()
    ]


@router.post("/create-order")
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

    supabase = get_supabase()

    # Idempotency: check if this payment was already processed
    existing = supabase.table("payment_log") \
        .select("id") \
        .eq("razorpay_payment_id", payload.razorpay_payment_id) \
        .execute()
    if existing.data:
        balance = await get_credit_balance(user_id)
        return {"success": True, "balance": balance, "already_applied": True}

    credits_to_add = pack["credits"]

    # Add credits to user's balance
    current = supabase.table("credits").select("balance, lifetime_purchased").eq("user_id", user_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Credit record not found")

    new_balance = current.data["balance"] + credits_to_add
    lifetime_purchased = (current.data.get("lifetime_purchased") or 0) + credits_to_add

    supabase.table("credits").update({
        "balance": new_balance,
        "lifetime_purchased": lifetime_purchased,
    }).eq("user_id", user_id).execute()

    # Log the payment
    supabase.table("payment_log").insert({
        "user_id": user_id,
        "pack_id": payload.pack_id,
        "credits_added": credits_to_add,
        "amount_paise": pack["amount_paise"],
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_payment_id": payload.razorpay_payment_id,
    }).execute()

    return {"success": True, "balance": new_balance, "credits_added": credits_to_add}
