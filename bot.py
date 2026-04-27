import os
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "8571456692:AAHfA98B-z9Y18mDm-gP9jmpI9Wq6Xw5fZg")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://YOUR_FRONTEND_URL")

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "друг"

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="💸 Открыть Finansi",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton("📊 Помощь", callback_data="help")]
    ])

    await update.message.reply_text(
        f"Привет, {name}! 👋\n\n"
        f"💸 *Finansi* — твой личный финансовый трекер\n\n"
        f"✅ Записывай доходы и расходы\n"
        f"📊 Смотри аналитику по категориям\n"
        f"🤖 ИИ-ассистент на базе Mistral AI\n"
        f"📥 Экспорт в Excel\n\n"
        f"Нажми кнопку ниже, чтобы открыть приложение 👇",
        parse_mode="Markdown",
        reply_markup=keyboard
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 *Finansi — Помощь*\n\n"
        "• `/start` — Открыть приложение\n\n"
        "*Возможности приложения:*\n"
        "• Добавление доходов и расходов\n"
        "• Аналитика за неделю/месяц/год\n"
        "• Графики по категориям\n"
        "• ИИ-ассистент: просто напишите «Добавь расход 500 на еду»\n"
        "• Экспорт всех транзакций в Excel\n"
        "• Удаление транзакций свайпом влево\n",
        parse_mode="Markdown"
    )


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    logger.info("Finansi Bot started...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
