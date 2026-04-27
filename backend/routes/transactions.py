from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import Transaction, User, Category
from schemas import TransactionCreate, TransactionOut
from routes.users import get_or_create_user
from datetime import datetime
from typing import Optional, List

router = APIRouter()


def get_user(x_telegram_user_id: str = Header(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == x_telegram_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Call /api/users/init first.")
    return user


@router.post("", response_model=TransactionOut)
def create_transaction(
    data: TransactionCreate,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    if data.type not in ("income", "expense"):
        raise HTTPException(status_code=400, detail="type must be 'income' or 'expense'")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    category = None
    if data.category_id:
        category = db.query(Category).filter(
            Category.id == data.category_id,
            Category.user_id == user.id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    tx = Transaction(
        user_id=user.id,
        type=data.type,
        amount=data.amount,
        category_id=category.id if category else None,
        note=data.note,
        date=data.date or datetime.utcnow()
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    category_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    q = db.query(Transaction).filter(Transaction.user_id == user.id)
    if type:
        q = q.filter(Transaction.type == type)
    if date_from:
        q = q.filter(Transaction.date >= date_from)
    if date_to:
        q = q.filter(Transaction.date <= date_to)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)

    return q.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"ok": True}
