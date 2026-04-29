"""Pytest configuration: configure test environment before any app modules load."""
import os

# Must be set before any app module imports happen
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DEV_MODE", "true")
os.environ.setdefault("TESTING", "true")
