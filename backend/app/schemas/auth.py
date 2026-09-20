from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    email: EmailStr
    auth_hash: str = Field(..., min_length=16, description="Client-side derived auth key hash")
    kdf_salt: str = Field(..., description="Base64 or hex salt used for KDF")
    kdf_iterations: int = Field(default=600000, ge=100000)

class UserLoginRequest(BaseModel):
    email: EmailStr
    auth_hash: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    kdf_salt: str
    kdf_iterations: int

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    kdf_salt: str
    kdf_iterations: int
    created_at: datetime
