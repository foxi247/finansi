import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Transaction, Category
from schemas import AIChatMessage, AIChatResponse, TransactionCreate
from ai_assistant import chat_with_ai, build_user_summary
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    data: AIChatMessage,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id
    ).order_by(Transaction.date.asc()).all()

    user_summary, recent_tx = build_user_summary(transactions)

    try:
        result = await chat_with_ai(
            message=data.message,
            user_summary=user_summary,
            recent_transactions=recent_tx
        )
    except Exception as e:
        logger.error(f"AI error [{type(e).__name__}]: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"[{type(e).__name__}] {str(e)}")

    # Enrich action with category_id if possible, but do NOT auto-create the transaction.
    # The frontend will show a confirmation card and call /api/ai/confirm (or /api/transactions).
    action = result.get("action")
    if action and action.get("type") == "add_transaction":
        action_data = action.get("data", {})
        tx_type = action_data.get("type", "expense")
        category_name = action_data.get("category", "Другое")

        category = db.query(Category).filter(
            Category.user_id == user.id,
            Category.type == tx_type,
            Category.name == category_name
        ).first()

        if not category:
            category = db.query(Category).filter(
                Category.user_id == user.id,
                Category.type == tx_type,
                Category.name == "Другое"
            ).first()

        action_data["category_id"] = category.id if category else None
        action["requires_confirmation"] = True

    return AIChatResponse(reply=result["reply"], action=action)


@router.post("/confirm")
def confirm_transaction(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create the transaction that the AI suggested after user confirmation."""
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
    return {"ok": True, "id": tx.id}
