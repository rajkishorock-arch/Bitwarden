from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database.session import get_db
from app.models import User, Tag
from app.schemas.tag import TagCreate, TagResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("", response_model=List[TagResponse])
async def get_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tag).where(Tag.user_id == current_user.id).order_by(Tag.name.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_in: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = Tag(
        user_id=current_user.id,
        name=tag_in.name,
        color=tag_in.color
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    result = await db.execute(query)
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted successfully"}
