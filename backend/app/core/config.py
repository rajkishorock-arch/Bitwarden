from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "VaultGuard Security Password Manager"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "DEV_ONLY_SECRET_KEY_CHANGE_IN_PRODUCTION_928374928374"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    ENVIRONMENT: str = "development"
    
    # SQLite default for dev, PostgreSQL compatible for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./vault.db"
    
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @property
    def COOKIE_SAMESITE(self) -> str:
        # In production cross-site deployment (Vercel -> Render), SameSite=none is mandatory.
        # In local development over HTTP, Chrome/browsers require SameSite=lax for non-secure cookies.
        return "none" if self.ENVIRONMENT.lower() == "production" else "lax"

    @property
    def COOKIE_SECURE(self) -> bool:
        # Secure=True is mandatory when SameSite=none in production.
        return self.ENVIRONMENT.lower() == "production"

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
          return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
