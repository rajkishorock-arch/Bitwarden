from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.csrf import generate_csrf_token, set_csrf_cookie, CSRF_COOKIE_NAME
from app.database.session import get_db
from app.models import User, UserSettings
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_auth = get_password_hash(req.auth_hash)

    user = User(
        email=req.email.lower(),
        auth_hash=hashed_auth,
        auth_salt=req.auth_salt,
        vault_salt=req.vault_salt,
        kdf_iterations=req.kdf_iterations
    )
    db.add(user)
    await db.flush()

    settings_obj = UserSettings(user_id=user.id)
    db.add(settings_obj)

    await db.commit()
    await db.refresh(user)

    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    req: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalars().first()

    if not user or not verify_password(req.auth_hash, user.auth_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or authentication key."
        )

    access_token = create_access_token(subject=user.id)
    csrf_token = generate_csrf_token()

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    set_csrf_cookie(response, csrf_token)

    return TokenResponse(
        access_token=access_token,
        csrf_token=csrf_token,
        user_id=user.id,
        email=user.email,
        auth_salt=user.auth_salt,
        vault_salt=user.vault_salt,
        kdf_iterations=user.kdf_iterations
    )

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE
    )
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path="/",
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
