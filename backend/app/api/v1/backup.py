from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database.session import get_db
from app.models import User, VaultItem, Tag
from app.api.deps import get_current_user

router = APIRouter(prefix="/backup", tags=["backup"])

class BackupExportResponse(BaseModel):
    version: str = "1.0"
    exported_at: str
    user_email: str
    items: List[Dict[str, Any]]

class BackupImportItem(BaseModel):
    item_type: str
    title_encrypted: str
    payload_encrypted: str
    nonce: str
    is_favorite: bool = False

class BackupImportRequest(BaseModel):
    items: List[BackupImportItem]

@router.get("/export", response_model=BackupExportResponse)
async def export_vault(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(VaultItem)
        .options(selectinload(VaultItem.tags))
        .where(VaultItem.user_id == current_user.id)
    )
    result = await db.execute(query)
    items = result.scalars().all()

    item_payloads = [
        {
            "id": item.id,
            "item_type": item.item_type,
            "title_encrypted": item.title_encrypted,
            "payload_encrypted": item.payload_encrypted,
            "nonce": item.nonce,
            "is_favorite": item.is_favorite,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat()
        }
        for item in items
    ]

    return BackupExportResponse(
        exported_at=datetime.now(timezone.utc).isoformat(),
        user_email=current_user.email,
        items=item_payloads
    )

@router.post("/import")
async def import_vault(
    payload: BackupImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    imported_count = 0
    for item_in in payload.items:
        new_item = VaultItem(
            user_id=current_user.id,
            item_type=item_in.item_type,
            title_encrypted=item_in.title_encrypted,
            payload_encrypted=item_in.payload_encrypted,
            nonce=item_in.nonce,
            is_favorite=item_in.is_favorite
        )
        db.add(new_item)
        imported_count += 1

    await db.commit()
    return {"message": f"Successfully imported {imported_count} vault items."}
