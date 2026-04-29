# Finansi — Telegram Mini App for Personal Finance

A full-stack personal finance tracker built as a Telegram Mini App.
Track income and expenses, view analytics, and chat with an AI assistant powered by Mistral AI.

## Features

- Income and expense tracking with categories
- Analytics for any time period with charts (Recharts)
- AI assistant: add transactions and ask questions in natural language
- AI confirmation flow: the bot suggests a transaction, you confirm or cancel
- Excel export
- Swipe-to-delete on transaction cards
- Dark UI with Framer Motion animations
- Telegram WebApp initData validation for security

## Project Structure

```
finansi/
├── backend/              # FastAPI + SQLAlchemy
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── dependencies.py   # get_current_user dependency
│   ├── auth.py           # Telegram initData validation
│   ├── ai_assistant.py   # Mistral AI integration
│   ├── alembic/          # Database migrations
│   ├── routes/
│   │   ├── users.py
│   │   ├── transactions.py
│   │   ├── categories.py
│   │   ├── analytics.py
│   │   ├── ai_chat.py
│   │   └── export_routes.py
│   ├── tests/
│   │   └── test_transactions.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # React + Vite (Mini App UI)
│   ├── src/
│   │   ├── api/client.js
│   │   ├── App.jsx
│   │   ├── pages/
│   │   └── components/
│   └── .env.example
├── bot.py                # Telegram Bot (start menu)
├── bot_requirements.txt
└── .env.example
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A [Mistral AI](https://console.mistral.ai/) API key

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd finansi

# Root .env (for bot.py)
cp .env.example .env
# Fill in BOT_TOKEN and MINI_APP_URL

# Backend .env
cp backend/.env.example backend/.env
# Fill in MISTRAL_API_KEY (and DATABASE_URL for production)

# Frontend .env (optional for local dev — proxy handles /api)
cp frontend/.env.example frontend/.env.local
```

### 2. Run the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The Mini App UI will be available at `http://localhost:5173`.
All `/api` requests are proxied to `http://localhost:8000` automatically.

### 4. Run the Bot

```bash
# From the repo root
pip install -r bot_requirements.txt
python bot.py
```

### 5. Run Tests

```bash
cd backend
pip install pytest httpx
DEV_MODE=true pytest tests/ -v
```

## Environment Variables

### Root `.env` (bot.py)

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `MINI_APP_URL` | Public URL of the deployed frontend |

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `MISTRAL_API_KEY` | — | Mistral AI API key |
| `DATABASE_URL` | `sqlite:///./finansi.db` | SQLite (dev) or PostgreSQL (prod) |
| `DEV_MODE` | `false` | Set to `true` to skip Telegram initData validation |
| `CORS_ORIGINS` | `*` (when DEV_MODE) | Comma-separated list of allowed CORS origins |

### `frontend/.env.local` (optional)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | API base URL (proxied in dev, absolute in prod) |

## Database Migrations (Alembic)

The app uses SQLAlchemy with Alembic for migrations.

```bash
cd backend

# Apply all migrations (creates tables)
alembic upgrade head

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Downgrade one step
alembic downgrade -1
```

For local development with SQLite, `main.py` calls `Base.metadata.create_all()` on startup,
so you don't need to run migrations manually.

## Supabase (PostgreSQL) Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → Database**, find the **Connection string** (URI format).
   It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.axfqtfyllpgkitgttnpe.supabase.co:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` with your database password.
4. Set it in `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.axfqtfyllpgkitgttnpe.supabase.co:5432/postgres
   DEV_MODE=false
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
5. Run migrations: `cd backend && alembic upgrade head`

## Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Create a bot with `/newbot` — save the token in `.env` as `BOT_TOKEN`.
3. After deploying the frontend, run `/newapp` or use **Menu Button**:
   - `/mybots` → select your bot → **Menu Button** → **Configure menu button**
   - Set the URL to your deployed frontend URL.
4. Set `MINI_APP_URL` in `.env` to the same URL.

## Local Testing with ngrok

To test the Telegram Mini App locally you need HTTPS.

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5173
```

Copy the `https://xxxx.ngrok-free.app` URL, set it in @BotFather as the Menu Button URL,
and in your root `.env` as `MINI_APP_URL`.

Also update `CORS_ORIGINS` in `backend/.env` to include the ngrok URL.

## Deployment

### Frontend — Vercel

```bash
cd frontend
npm run build        # produces frontend/dist/

# Push to GitHub and import the repo in vercel.com
# Set Build Command: npm run build
# Set Output Directory: dist
# Set VITE_API_URL to your backend URL, e.g. https://my-backend.railway.app/api
```

### Backend — Railway or Render

**Railway:**
1. Connect your GitHub repo.
2. Set the root directory to `backend/`.
3. Add environment variables in the Railway dashboard.
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Render:**
1. New Web Service → connect repo.
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `backend/.env.example`.

## API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/api/users/init` | Register/login via Telegram initData |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/{id}` | Update transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/analytics/summary` | Income/expense totals |
| GET | `/api/analytics/by-category` | Breakdown by category |
| GET | `/api/analytics/trend` | Daily trend data |
| POST | `/api/ai/chat` | Chat with AI assistant |
| POST | `/api/ai/confirm` | Confirm AI-suggested transaction |
| GET | `/api/export/excel` | Download Excel report |
| GET | `/health` | Health check |

All endpoints except `/api/users/init` and `/health` require the `X-Telegram-User-Id` header.

## Security Notes

- In production (`DEV_MODE=false`), the `/api/users/init` endpoint validates the Telegram `initData`
  HMAC signature, ensuring only real Telegram users can create accounts.
- The `BOT_TOKEN` is used server-side only for HMAC verification — never expose it to the frontend.
- In `DEV_MODE=true`, initData validation is skipped and you can pass a `telegram_id` directly.
  Never enable `DEV_MODE` in production.
