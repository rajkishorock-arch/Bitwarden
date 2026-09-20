from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "VaultGuard Security Password Manager"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "DEV_ONLY_SECRET_KEY_CHANGE_IN_PRODUCTION_928374928374"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default for dev, PostgreSQL compatible for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./vault.db"
    
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
          return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
