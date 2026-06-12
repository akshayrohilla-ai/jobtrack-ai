import hashlib
from fastapi import Request
from slowapi.util import get_remote_address


def user_or_ip(request: Request) -> str:
    """
    Rate-limit key function.

    Keys on the caller's session (a hash of the bearer token) when present,
    otherwise falls back to the client IP. This makes per-user limits resilient
    to IP rotation behind a proxy (Render/Cloudflare), where pure-IP limiting is
    trivially bypassed or unfairly shared.

    The token is NOT verified here (auth happens in the endpoint) — this only
    needs to be a stable per-caller key. We hash it so raw credentials are never
    used as a limiter key.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1].strip()
        if token:
            return "u:" + hashlib.sha256(token.encode()).hexdigest()[:32]
    return "ip:" + get_remote_address(request)
