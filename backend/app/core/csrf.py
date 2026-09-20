import secrets
import hmac
from fastapi import Request, status, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
EXEMPT_PATHS = {
    "/health",
    f"{settings.API_V1_STR}/auth/login",
    f"{settings.API_V1_STR}/auth/register",
    f"{settings.API_V1_STR}/openapi.json",
    "/docs",
    "/redoc",
}

def generate_csrf_token() -> str:
    """Generate a cryptographically secure random CSRF token."""
    return secrets.token_hex(32)

def set_csrf_cookie(response: Response, csrf_token: str) -> None:
    """Set the non-HttpOnly CSRF cookie so the frontend client can read and submit it in X-CSRF-Token header."""
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,  # Must be readable by frontend JS to attach in X-CSRF-Token header
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        path="/",
    )

class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces Double-Submit Cookie CSRF protection for state-changing HTTP requests.
    Exempts safe methods (GET, HEAD, OPTIONS) and explicit unauthenticated auth endpoints (login, register).
    """
    async def dispatch(self, request: Request, call_next):
        if request.method not in SAFE_METHODS and request.url.path not in EXEMPT_PATHS:
            # Only enforce CSRF if session authentication cookie is present
            session_cookie = request.cookies.get("access_token")
            if session_cookie:
                csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
                csrf_header = request.headers.get(CSRF_HEADER_NAME)

                if not csrf_cookie or not csrf_header or not hmac.compare_digest(csrf_cookie, csrf_header):
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "CSRF token validation failed or token missing."}
                    )

        response = await call_next(request)
        return response
