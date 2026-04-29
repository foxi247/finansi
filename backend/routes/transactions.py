from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction, User, Category
from schemas import TransactionCreate, TransactionOut, TransactionUpdate
from dependencies import get_current_user
from datetime import datetime
from typing import Optional, List

router = APIRouter()


@router.post("", response_model=TransactionOut)
def create_transaction(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
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
    user: User = Depends(get_current_user),
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


@router.patch("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    data: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if data.amount is not None:
        if data.amount <= 0:
            raise HTTPException(status_code=400, detail="amount must be positive")
        tx.amount = data.amount

    if data.note is not None:
        tx.note = data.note

    if data.date is not None:
        tx.date = data.date

    if data.category_id is not None:
        category = db.query(Category).filter(
            Category.id == data.category_id,
            Category.user_id == user.id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        tx.category_id = data.category_id

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    user: User = Depends(get_current_user),
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
