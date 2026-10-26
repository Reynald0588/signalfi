"""Project configuration and tiny .env loader (standard library only)."""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlencode

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
ASSETS_DIR = ROOT_DIR / "assets"
REPORTS_DIR = DATA_DIR / "reports"


def load_dotenv() -> None:
    """Load simple KEY=VALUE pairs from .env without overriding real env vars."""
    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv()

HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "15"))
MAX_EVENTS = int(os.getenv("MAX_EVENTS", "24"))
AI_MAX_EVENTS = int(os.getenv("AI_MAX_EVENTS", "12"))

AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.deepseek.com/v1").rstrip("/")
AI_MODEL = os.getenv("AI_MODEL", "deepseek-chat").strip()
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0 Safari/537.36 ChainSignal/0.1"
)

# Add or remove feeds here. A failing source does not stop the rest of the run.
RSS_SOURCES = [
    {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/"},
    {"name": "Cointelegraph", "url": "https://cointelegraph.com/rss"},
    {"name": "Decrypt", "url": "https://decrypt.co/feed"},
    {"name": "The Block", "url": "https://www.theblock.co/rss.xml"},
    {"name": "Bitcoin Magazine", "url": "https://bitcoinmagazine.com/feed"},
    {"name": "CryptoSlate", "url": "https://cryptoslate.com/feed/"},
]

MARKET_URL = "https://api.coingecko.com/api/v3/coins/markets?" + urlencode(
    {
        "vs_currency": "usd",
        "ids": "bitcoin,ethereum,solana",
        "price_change_percentage": "24h",
    }
)
GLOBAL_MARKET_URL = "https://api.coingecko.com/api/v3/global"
FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=2"
POLYMARKET_URL = "https://gamma-api.polymarket.com/markets?" + urlencode(
    {
        "active": "true",
        "closed": "false",
        "limit": "100",
        "order": "volume24hr",
        "ascending": "false",
    }
)
