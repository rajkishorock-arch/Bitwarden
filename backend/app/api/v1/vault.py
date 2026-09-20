from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database.session import get_db
from app.models import User, VaultItem, Tag
from app.schemas.vault import VaultItemCreate, VaultItemUpdate, VaultItemResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/vault", tags=["vault"])

@router.get("/items", response_model=List[VaultItemResponse])
async def get_vault_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(VaultItem)
        .options(selectinload(VaultItem.tags))
        .where(VaultItem.user_id == current_user.id)
        .order_by(VaultItem.updated_at.desc())
    )
    result = await db.execute(query)
    items = result.scalars().all()
    return items

@router.post("/items", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
async def create_vault_item(
    item_in: VaultItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch tags if requested
    associated_tags = []
    if item_in.tag_ids:
        tag_result = await db.execute(
            select(Tag).where(Tag.id.in_(item_in.tag_ids), Tag.user_id == current_user.id)
        )
        associated_tags = tag_result.scalars().all()

    item = VaultItem(
        user_id=current_user.id,
        item_type=item_in.item_type,
        encrypted_payload=item_in.encrypted_payload,
        nonce=item_in.nonce,
        is_favorite=item_in.is_favorite,
        tags=associated_tags
    )

    db.add(item)
    await db.commit()
    
    # Reload item with tags
    query = select(VaultItem).options(selectinload(VaultItem.tags)).where(VaultItem.id == item.id)
    result = await db.execute(query)
    created_item = result.scalars().first()
    return created_item

@router.get("/items/{item_id}", response_model=VaultItemResponse)
async def get_vault_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(VaultItem)
        .options(selectinload(VaultItem.tags))
        .where(VaultItem.id == item_id, VaultItem.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")
    return item

@router.put("/items/{item_id}", response_model=VaultItemResponse)
async def update_vault_item(
    item_id: str,
    item_in: VaultItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(VaultItem)
        .options(selectinload(VaultItem.tags))
        .where(VaultItem.id == item_id, VaultItem.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

    if item_in.item_type is not None:
        item.item_type = item_in.item_type
    if item_in.encrypted_payload is not None:
        item.encrypted_payload = item_in.encrypted_payload
    if item_in.nonce is not None:
        item.nonce = item_in.nonce
    if item_in.is_favorite is not None:
        item.is_favorite = item_in.is_favorite

    if item_in.tag_ids is not None:
        tag_result = await db.execute(
            select(Tag).where(Tag.id.in_(item_in.tag_ids), Tag.user_id == current_user.id)
        )
        item.tags = tag_result.scalars().all()

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/items/{item_id}")
async def delete_vault_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(VaultItem).where(VaultItem.id == item_id, VaultItem.user_id == current_user.id)
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Item deleted successfully"}

@router.patch("/items/{item_id}/favorite", response_model=VaultItemResponse)
async def toggle_favorite(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(VaultItem)
        .options(selectinload(VaultItem.tags))
        .where(VaultItem.id == item_id, VaultItem.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

    item.is_favorite = not item.is_favorite
    await db.commit()
    await db.refresh(item)
    return item
