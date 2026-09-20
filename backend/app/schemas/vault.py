from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class VaultItemCreate(BaseModel):
    item_type: str = Field(..., description="'login' | 'card' | 'note'")
    encrypted_payload: str
    nonce: str
    is_favorite: bool = False
    tag_ids: Optional[List[str]] = []

class VaultItemUpdate(BaseModel):
    item_type: Optional[str] = None
    encrypted_payload: Optional[str] = None
    nonce: Optional[str] = None
    is_favorite: Optional[bool] = None
    tag_ids: Optional[List[str]] = None

class TagSimpleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    color: str

class VaultItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    item_type: str
    encrypted_payload: str
    nonce: str
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    tags: List[TagSimpleResponse] = []
