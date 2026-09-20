from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "VaultGuard Security Password Manager"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "DEV_ONLY_SECRET_KEY_CHANGE_IN_PRODUCTION_928374928374"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default, PostgreSQL compatible URL
    DATABASE_URL: str = "sqlite+aiosqlite:///./vault.db"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
