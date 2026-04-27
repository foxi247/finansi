import httpx
import json
import os
import logging

logger = logging.getLogger(__name__)

MISTRAL_BASE_URL = "https://api.mistral.ai/v1"
MISTRAL_MODEL = "mistral-large-latest"

SYSTEM_PROMPT = """Ты финансовый ИИ-ассистент приложения "Finansi". Ты помогаешь пользователям управлять личными финансами, анализировать расходы и доходы, давать советы по финансовой грамотности.

Ты умеешь:
1. Добавлять транзакции по запросу пользователя
2. Отвечать на вопросы о финансах пользователя на основе его данных
3. Давать советы по экономии и управлению деньгами

Финансовые данные пользователя:
{user_summary}

Последние транзакции:
{recent_transactions}

ПРАВИЛА ОТВЕТА:
- Отвечай ТОЛЬКО на русском языке
- Отвечай коротко и по делу (2-4 предложения)
- Если пользователь хочет добавить расход или доход — распарси данные и верни JSON-блок в конце ответа в таком формате:
  [ACTION:add_transaction]{{"type":"expense","amount":500,"category":"Еда","note":"кофе"}}[/ACTION]
- Если пользователь спрашивает про траты/доходы за период — анализируй данные и отвечай конкретными цифрами
- Категории для расходов: Еда, Транспорт, Жильё, Здоровье, Развлечения, Одежда, Связь, Образование, Красота, Покупки, Другое
- Категории для доходов: Зарплата, Фриланс, Инвестиции, Подарки, Вклады, Другое
- Сумму всегда указывай в рублях
- Будь дружелюбным и поддерживающим
"""


async def chat_with_ai(message: str, user_summary: str, recent_transactions: str) -> dict:
    system = SYSTEM_PROMPT.format(
        user_summary=user_summary,
        recent_transactions=recent_transactions
    )

    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": message}
        ],
        "temperature": 0.7,
        "max_tokens": 512
    }

    api_key = os.getenv("MISTRAL_API_KEY", "")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY не задан в .env файле")

    logger.info(f"Sending request to Mistral, model={MISTRAL_MODEL}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{MISTRAL_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )

        if response.status_code != 200:
            raise ValueError(f"Mistral API {response.status_code}: {response.text[:300]}")

        try:
            data = response.json()
        except Exception:
            raise ValueError(f"Не удалось разобрать JSON от Mistral: {response.text[:200]}")

    if "choices" not in data or not data["choices"]:
        raise ValueError(f"Неожиданный ответ Mistral (нет choices): {str(data)[:200]}")

    raw_reply = data["choices"][0].get("message", {}).get("content", "")
    if not raw_reply:
        raise ValueError(f"Пустой content в ответе Mistral: {str(data)[:200]}")

    logger.info(f"Mistral responded OK, length={len(raw_reply)}")
    return _parse_ai_response(raw_reply)


def _parse_ai_response(raw: str) -> dict:
    action = None
    reply = raw.strip()

    if "[ACTION:add_transaction]" in raw and "[/ACTION]" in raw:
        try:
            start = raw.index("[ACTION:add_transaction]") + len("[ACTION:add_transaction]")
            end = raw.index("[/ACTION]")
            json_str = raw[start:end].strip()
            action_data = json.loads(json_str)
            action = {"type": "add_transaction", "data": action_data}

            reply = raw[:raw.index("[ACTION:add_transaction]")].strip()
            if not reply:
                tx_type = action_data.get("type", "expense")
                amount = action_data.get("amount", 0)
                category = action_data.get("category", "")
                word = "расход" if tx_type == "expense" else "доход"
                reply = f"Добавляю {word}: {amount:,.0f} ₽ — {category} ✅"
        except Exception as e:
            logger.warning(f"Failed to parse ACTION block: {e}")
            action = None
            # reply уже равен raw.strip() — покажем ответ ИИ как есть

    return {"reply": reply, "action": action}


def build_user_summary(transactions: list) -> tuple:
    if not transactions:
        return "Нет данных о транзакциях", "Нет транзакций"

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = total_income - total_expense

    summary = (
        f"Баланс: {balance:,.0f} ₽ | "
        f"Доходы всего: {total_income:,.0f} ₽ | "
        f"Расходы всего: {total_expense:,.0f} ₽"
    )

    recent = transactions[-15:]
    lines = []
    for t in reversed(recent):
        cat_name = t.category.name if t.category else "Без категории"
        sign = "+" if t.type == "income" else "-"
        date_str = t.date.strftime("%d.%m")
        lines.append(f"{date_str} {sign}{t.amount:,.0f}₽ [{cat_name}] {t.note or ''}")

    return summary, "\n".join(lines) if lines else "Нет последних транзакций"
