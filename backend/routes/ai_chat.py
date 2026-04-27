import logging
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Transaction, Category
from schemas import AIChatMessage, AIChatResponse
from ai_assistant import chat_with_ai, build_user_summary
from routes.transactions import get_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    data: AIChatMessage,
    user: User = Depends(get_user),
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

    if result.get("action") and result["action"]["type"] == "add_transaction":
        action_data = result["action"]["data"]
        tx_type = action_data.get("type", "expense")
        amount = float(action_data.get("amount", 0))
        category_name = action_data.get("category", "Другое")
        note = action_data.get("note", "")

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

        if amount > 0:
            from models import Transaction as TxModel
            from datetime import datetime
            tx = TxModel(
                user_id=user.id,
                type=tx_type,
                amount=amount,
                category_id=category.id if category else None,
                note=note or None,
                date=datetime.utcnow()
            )
            db.add(tx)
            db.commit()

    return AIChatResponse(reply=result["reply"], action=result.get("action"))
