from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User


async def get_current_user(
    x_telegram_user_id: str = Header(...),
    db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.telegram_id == x_telegram_user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Call /api/users/init first."
        )
    return user
