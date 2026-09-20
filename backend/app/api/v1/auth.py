from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

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
    # Check if user with email already exists
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash the auth credentials
    hashed_auth = get_password_hash(req.auth_hash)

    user = User(
        email=req.email.lower(),
        auth_hash=hashed_auth,
        kdf_salt=req.kdf_salt,
        kdf_iterations=req.kdf_iterations
    )
    db.add(user)
    await db.flush()

    # Create default user settings
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

    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False  # Set True in production with HTTPS
    )

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        kdf_salt=user.kdf_salt,
        kdf_iterations=user.kdf_iterations
    )

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
