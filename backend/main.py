from dotenv import load_dotenv
load_dotenv()  # must be before all other imports so env vars are available

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import users, transactions, categories, analytics, ai_chat, export_routes

# Create tables automatically unless running under pytest (tests manage their own schema)
if not os.getenv("TESTING"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finansi API", version="1.0.0")

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
cors_origins_env = os.getenv("CORS_ORIGINS", "")

if DEV_MODE or not cors_origins_env:
    cors_origins = ["*"]
else:
    cors_origins = [o.strip() for o in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
