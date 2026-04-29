import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import User, Category
from schemas import UserOut
from auth import validate_telegram_init_data

router = APIRouter()

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Еда", "icon": "🍕", "color": "#FF6B6B"},
    {"name": "Транспорт", "icon": "🚗", "color": "#4ECDC4"},
    {"name": "Жильё", "icon": "🏠", "color": "#45B7D1"},
    {"name": "Здоровье", "icon": "💊", "color": "#96CEB4"},
    {"name": "Развлечения", "icon": "🎮", "color": "#FFEAA7"},
    {"name": "Одежда", "icon": "👔", "color": "#DDA0DD"},
    {"name": "Связь", "icon": "📱", "color": "#98D8C8"},
    {"name": "Образование", "icon": "📚", "color": "#F7DC6F"},
    {"name": "Красота", "icon": "💇", "color": "#F1948A"},
    {"name": "Покупки", "icon": "🛒", "color": "#82E0AA"},
    {"name": "Другое", "icon": "❓", "color": "#AEB6BF"},
]

DEFAULT_INCOME_CATEGORIES = [
    {"name": "Зарплата", "icon": "💼", "color": "#10D9A0"},
    {"name": "Фриланс", "icon": "💻", "color": "#7B68EE"},
    {"name": "Инвестиции", "icon": "📈", "color": "#FFD700"},
    {"name": "Подарки", "icon": "🎁", "color": "#FF69B4"},
    {"name": "Вклады", "icon": "🏦", "color": "#20B2AA"},
    {"name": "Другое", "icon": "💰", "color": "#AEB6BF"},
]


def get_or_create_user(telegram_id: str, db: Session, first_name=None, last_name=None, username=None):
    user = db.query(User).filter(User.telegram_id == str(telegram_id)).first()
    if not user:
        user = User(
            telegram_id=str(telegram_id),
            first_name=first_name,
            last_name=last_name,
            username=username
        )
        db.add(user)
        db.flush()

        for cat in DEFAULT_EXPENSE_CATEGORIES:
            db.add(Category(user_id=user.id, type="expense", is_default=True, **cat))
        for cat in DEFAULT_INCOME_CATEGORIES:
            db.add(Category(user_id=user.id, type="income", is_default=True, **cat))
        db.commit()
        db.refresh(user)
    return user


class UserInit(BaseModel):
    init_data: Optional[str] = None  # Telegram WebApp initData
    # Fallback for dev mode only
    telegram_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


@router.post("/init", response_model=UserOut)
def init_user(data: UserInit, db: Session = Depends(get_db)):
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"

    if data.init_data:
        tg_user = validate_telegram_init_data(data.init_data)
        if not tg_user and not dev_mode:
            raise HTTPException(status_code=401, detail="Invalid Telegram initData")
        if tg_user:
            telegram_id = str(tg_user.get("id"))
            first_name = tg_user.get("first_name")
            username = tg_user.get("username")
            last_name = tg_user.get("last_name")
        else:
            # dev mode: validation failed but allowed
            telegram_id = data.telegram_id or "dev_user"
            first_name = data.first_name
            username = data.username
            last_name = data.last_name
    elif dev_mode and data.telegram_id:
        telegram_id = data.telegram_id
        first_name = data.first_name
        username = data.username
        last_name = data.last_name
    else:
        raise HTTPException(
            status_code=400,
            detail="init_data required (or DEV_MODE=true with telegram_id)"
        )

    user = get_or_create_user(
        telegram_id,
        db,
        first_name=first_name,
        last_name=last_name,
        username=username
    )
    return user
