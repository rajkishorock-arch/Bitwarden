from fastapi import APIRouter
from app.api.v1 import auth, vault, tags, settings, backup

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(vault.router)
api_router.include_router(tags.router)
api_router.include_router(settings.router)
api_router.include_router(backup.router)
