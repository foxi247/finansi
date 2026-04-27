from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Transaction, Category
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict

router = APIRouter()


def get_user(x_telegram_user_id: str = Header(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == x_telegram_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/summary")
def get_summary(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    q = db.query(Transaction).filter(Transaction.user_id == user.id)
    if date_from:
        q = q.filter(Transaction.date >= date_from)
    if date_to:
        q = q.filter(Transaction.date <= date_to)

    transactions = q.all()
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "count": len(transactions)
    }


@router.get("/by-category")
def get_by_category(
    type: str = "expense",
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    q = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.type == type
    )
    if date_from:
        q = q.filter(Transaction.date >= date_from)
    if date_to:
        q = q.filter(Transaction.date <= date_to)

    transactions = q.all()
    category_totals = defaultdict(lambda: {"amount": 0, "count": 0, "icon": "❓", "color": "#AEB6BF"})

    for t in transactions:
        name = t.category.name if t.category else "Без категории"
        icon = t.category.icon if t.category else "❓"
        color = t.category.color if t.category else "#AEB6BF"
        category_totals[name]["amount"] += t.amount
        category_totals[name]["count"] += 1
        category_totals[name]["icon"] = icon
        category_totals[name]["color"] = color

    total = sum(v["amount"] for v in category_totals.values())
    result = []
    for name, data in sorted(category_totals.items(), key=lambda x: -x[1]["amount"]):
        result.append({
            "name": name,
            "amount": data["amount"],
            "count": data["count"],
            "icon": data["icon"],
            "color": data["color"],
            "percent": round(data["amount"] / total * 100, 1) if total > 0 else 0
        })

    return result


@router.get("/trend")
def get_trend(
    days: int = Query(30, le=365),
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    date_from = datetime.utcnow() - timedelta(days=days)
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.date >= date_from
    ).all()

    daily = defaultdict(lambda: {"income": 0, "expense": 0})
    for t in transactions:
        day = t.date.strftime("%Y-%m-%d")
        daily[day][t.type] += t.amount

    result = []
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        result.append({
            "date": day,
            "income": daily[day]["income"],
            "expense": daily[day]["expense"]
        })

    return result
