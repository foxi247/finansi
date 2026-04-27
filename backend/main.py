from dotenv import load_dotenv
load_dotenv()  # must be before all other imports so env vars are available

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import users, transactions, categories, analytics, ai_chat, export_routes
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finansi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["ai"])
app.include_router(export_routes.router, prefix="/api/export", tags=["export"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Finansi API"}
