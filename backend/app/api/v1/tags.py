from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database.session import get_db
from app.models import User, Tag
from app.schemas.tag import TagCreate, TagUpdate, TagResponse
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
    tag_name_clean = tag_in.name.strip()
    if not tag_name_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag name cannot be empty.")
    if len(tag_name_clean) > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag name exceeds maximum length of 50 characters.")

    existing_query = select(Tag).where(
        Tag.user_id == current_user.id,
        Tag.name.ilike(tag_name_clean)
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this name already exists."
        )

    tag = Tag(
        user_id=current_user.id,
        name=tag_name_clean,
        color=tag_in.color
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str,
    tag_in: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    result = await db.execute(query)
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    if tag_in.name is not None:
        tag_name_clean = tag_in.name.strip()
        if not tag_name_clean:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag name cannot be empty.")
        if len(tag_name_clean) > 50:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag name exceeds maximum length of 50 characters.")

        existing_query = select(Tag).where(
            Tag.user_id == current_user.id,
            Tag.id != tag_id,
            Tag.name.ilike(tag_name_clean)
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A tag with this name already exists."
            )
        tag.name = tag_name_clean

    if tag_in.color is not None:
        tag.color = tag_in.color

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
