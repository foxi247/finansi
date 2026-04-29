"""Basic integration tests for the Finansi API.

Run with:
    cd backend
    pytest tests/ -v
"""
import os
import sys
import tempfile

# Ensure the backend directory is on the path BEFORE any app imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# ---------------------------------------------------------------------------
# Build a fresh test engine and monkey-patch database.py BEFORE main imports
# ---------------------------------------------------------------------------

import database  # import the module so we can patch its globals

_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Replace the engine and session factory that the whole app uses
database.engine = _test_engine
database.SessionLocal = _TestSessionLocal

# Now import models (uses database.Base which is not engine-specific) and create tables
import models  # noqa: ensure all mapped classes are registered
database.Base.metadata.create_all(bind=_test_engine)


def _override_get_db():
    db = _TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Force DEV_MODE before main.py reads the env
os.environ["DEV_MODE"] = "true"
os.environ["TESTING"] = "true"

import main  # noqa: import after patching

main.app.dependency_overrides[database.get_db] = _override_get_db

client = TestClient(main.app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TEST_TELEGRAM_ID = "999888777"
HEADERS = {"X-Telegram-User-Id": TEST_TELEGRAM_ID}


def init_test_user():
    resp = client.post(
        "/api/users/init",
        json={"telegram_id": TEST_TELEGRAM_ID, "first_name": "Test"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def get_first_category(tx_type: str = "expense") -> int:
    resp = client.get(f"/api/categories?type={tx_type}", headers=HEADERS)
    assert resp.status_code == 200, resp.text
    cats = resp.json()
    assert len(cats) > 0, f"No {tx_type} categories returned"
    return cats[0]["id"]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestTransactions:
    @pytest.fixture(autouse=True)
    def setup(self):
        init_test_user()

    def test_create_transaction(self):
        cat_id = get_first_category("expense")
        resp = client.post(
            "/api/transactions",
            json={
                "type": "expense",
                "amount": 250.00,
                "category_id": cat_id,
                "note": "Test coffee",
            },
            headers=HEADERS,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["type"] == "expense"
        assert float(data["amount"]) == 250.00
        assert data["note"] == "Test coffee"

    def test_create_income_transaction(self):
        cat_id = get_first_category("income")
        resp = client.post(
            "/api/transactions",
            json={
                "type": "income",
                "amount": 50000.00,
                "category_id": cat_id,
                "note": "Salary",
            },
            headers=HEADERS,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["type"] == "income"
        assert float(data["amount"]) == 50000.00

    def test_list_transactions(self):
        cat_id = get_first_category("expense")
        client.post(
            "/api/transactions",
            json={"type": "expense", "amount": 100.00, "category_id": cat_id},
            headers=HEADERS,
        )
        resp = client.get("/api/transactions", headers=HEADERS)
        assert resp.status_code == 200, resp.text
        txs = resp.json()
        assert isinstance(txs, list)
        assert len(txs) >= 1

    def test_delete_transaction(self):
        cat_id = get_first_category("expense")
        create_resp = client.post(
            "/api/transactions",
            json={"type": "expense", "amount": 77.50, "category_id": cat_id},
            headers=HEADERS,
        )
        assert create_resp.status_code == 200, create_resp.text
        tx_id = create_resp.json()["id"]

        delete_resp = client.delete(f"/api/transactions/{tx_id}", headers=HEADERS)
        assert delete_resp.status_code == 200, delete_resp.text
        assert delete_resp.json().get("ok") is True

        list_resp = client.get("/api/transactions", headers=HEADERS)
        ids = [t["id"] for t in list_resp.json()]
        assert tx_id not in ids

    def test_patch_transaction(self):
        cat_id = get_first_category("expense")
        create_resp = client.post(
            "/api/transactions",
            json={"type": "expense", "amount": 300.00, "category_id": cat_id},
            headers=HEADERS,
        )
        assert create_resp.status_code == 200, create_resp.text
        tx_id = create_resp.json()["id"]

        patch_resp = client.patch(
            f"/api/transactions/{tx_id}",
            json={"amount": 350.00, "note": "Updated note"},
            headers=HEADERS,
        )
        assert patch_resp.status_code == 200, patch_resp.text
        data = patch_resp.json()
        assert float(data["amount"]) == 350.00
        assert data["note"] == "Updated note"

    def test_create_transaction_invalid_type(self):
        resp = client.post(
            "/api/transactions",
            json={"type": "invalid", "amount": 100.00},
            headers=HEADERS,
        )
        assert resp.status_code == 400

    def test_create_transaction_negative_amount(self):
        resp = client.post(
            "/api/transactions",
            json={"type": "expense", "amount": -50.00},
            headers=HEADERS,
        )
        assert resp.status_code == 400


class TestAnalytics:
    @pytest.fixture(autouse=True)
    def setup(self):
        init_test_user()
        cat_id = get_first_category("expense")
        client.post(
            "/api/transactions",
            json={"type": "expense", "amount": 500.00, "category_id": cat_id},
            headers=HEADERS,
        )
        cat_id_income = get_first_category("income")
        client.post(
            "/api/transactions",
            json={"type": "income", "amount": 3000.00, "category_id": cat_id_income},
            headers=HEADERS,
        )

    def test_summary(self):
        resp = client.get("/api/analytics/summary", headers=HEADERS)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "total_income" in data
        assert "total_expense" in data
        assert "balance" in data
        assert data["total_income"] >= 3000.00
        assert data["total_expense"] >= 500.00

    def test_by_category(self):
        resp = client.get("/api/analytics/by-category?type=expense", headers=HEADERS)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert isinstance(data, list)
        if data:
            assert "name" in data[0]
            assert "amount" in data[0]
            assert "percent" in data[0]

    def test_trend(self):
        resp = client.get("/api/analytics/trend?days=7", headers=HEADERS)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 7
