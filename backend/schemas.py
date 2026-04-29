from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    telegram_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    telegram_id: str
    first_name: Optional[str]
    username: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str
    type: str
    color: str
    is_default: bool

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    icon: str
    type: str
    color: str = "#8B5CF6"


class TransactionCreate(BaseModel):
    type: str
    amount: float
    category_id: Optional[int] = None
    note: Optional[str] = None
    date: Optional[datetime] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    note: Optional[str] = None
    category_id: Optional[int] = None
    date: Optional[datetime] = None


class TransactionOut(BaseModel):
    id: int
    type: str
    amount: float
    note: Optional[str]
    date: datetime
    created_at: datetime
    category: Optional[CategoryOut]

    model_config = {"from_attributes": True}


class AIChatMessage(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    reply: str
    action: Optional[dict] = None  # {"type": "add_transaction", "data": {...}, "requires_confirmation": True}
