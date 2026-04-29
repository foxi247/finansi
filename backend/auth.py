import hashlib
import hmac
import json
import os
from urllib.parse import parse_qs, unquote

BOT_TOKEN = os.getenv("BOT_TOKEN", "")


def validate_telegram_init_data(init_data: str) -> dict | None:
    """Validate Telegram WebApp initData. Returns parsed user dict or None."""
    if not init_data or not BOT_TOKEN:
        return None
    try:
        parsed = parse_qs(init_data)
        hash_val = parsed.get("hash", [None])[0]
        if not hash_val:
            return None

        # Build data_check_string
        data_check_parts = []
        for key, values in sorted(parsed.items()):
            if key != "hash":
                data_check_parts.append(f"{key}={values[0]}")
        data_check_string = "\n".join(data_check_parts)

        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(computed_hash, hash_val):
            return None

        # Parse user
        user_json = parsed.get("user", [None])[0]
        if user_json:
            return json.loads(unquote(user_json))
        return {}
    except Exception:
        return None
