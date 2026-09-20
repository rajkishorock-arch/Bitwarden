from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserSettingsUpdate(BaseModel):
    auto_lock_minutes: Optional[int] = None
    clipboard_timeout_seconds: Optional[int] = None
    theme: Optional[str] = None

class UserSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    auto_lock_minutes: int
    clipboard_timeout_seconds: int
    theme: str
