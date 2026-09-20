from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TagCreate(BaseModel):
    name: str
    color: str = "#4F46E5"

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    color: str
    created_at: datetime
