from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Category
from schemas import UserCreate, UserOut

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


@router.post("/init", response_model=UserOut)
def init_user(data: UserCreate, db: Session = Depends(get_db)):
    user = get_or_create_user(
        telegram_id=data.telegram_id,
        db=db,
        first_name=data.first_name,
        last_name=data.last_name,
        username=data.username
    )
    return user
