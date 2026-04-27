# 💸 Finansi — Telegram Mini App

Личный финансовый трекер как Telegram Mini App с ИИ-ассистентом на базе Mistral AI.

## Возможности

- 📊 Отслеживание доходов и расходов с категориями
- 📈 Аналитика за любой период с красивыми графиками
- 🤖 ИИ-ассистент: добавляй транзакции и спрашивай про финансы голосом
- 📥 Экспорт в Excel
- 🎨 Красивый тёмный дизайн с анимациями
- 👆 Свайп для удаления транзакций

## Структура проекта

```
finansi/
├── backend/          # FastAPI + SQLite
├── frontend/         # React + Vite (Mini App)
├── bot.py            # Telegram Bot
└── .env              # Конфиги
```

## Запуск

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # dev режим
npm run build    # продакшн сборка
```

### 3. Telegram Bot

```bash
pip install -r bot_requirements.txt
python bot.py
```

## Деплой

1. Задеплой frontend на **Vercel** или **Netlify** (статичный билд)
2. Задеплой backend на **Railway** / **Render** / **VPS**
3. Укажи URL фронтенда в `.env` как `MINI_APP_URL`
4. В @BotFather настрой Menu Button → Web App URL

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни значения.

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | Токен бота от @BotFather |
| `MINI_APP_URL` | URL задеплоенного фронтенда |
| `MISTRAL_API_KEY` | API ключ Mistral AI |
| `DATABASE_URL` | SQLite или PostgreSQL URL |
