from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Category
from schemas import CategoryCreate, CategoryOut
from dependencies import get_current_user
from typing import List

router = APIRouter()


@router.get("", response_model=List[CategoryOut])
def list_categories(
    type: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Category).filter(Category.user_id == user.id)
    if type:
        q = q.filter(Category.type == type)
    return q.all()


@router.post("", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = Category(user_id=user.id, **data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
