from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.session import get_db
from app.models import User, UserSettings
from app.schemas.settings import UserSettingsUpdate, UserSettingsResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(UserSettings).where(UserSettings.user_id == current_user.id)
    result = await db.execute(query)
    user_settings = result.scalars().first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        await db.commit()
        await db.refresh(user_settings)
    return user_settings

@router.put("", response_model=UserSettingsResponse)
async def update_settings(
    settings_in: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(UserSettings).where(UserSettings.user_id == current_user.id)
    result = await db.execute(query)
    user_settings = result.scalars().first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    if settings_in.auto_lock_minutes is not None:
        user_settings.auto_lock_minutes = settings_in.auto_lock_minutes
    if settings_in.clipboard_timeout_seconds is not None:
        user_settings.clipboard_timeout_seconds = settings_in.clipboard_timeout_seconds
    if settings_in.theme is not None:
        user_settings.theme = settings_in.theme

    await db.commit()
    await db.refresh(user_settings)
    return user_settings
