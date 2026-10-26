"""Collect public Web3 signals and build the static dashboard data file.

Usage:
    python scripts/collect.py
    python scripts/collect.py --demo
    python scripts/collect.py --no-ai

Only Python's standard library is required.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

from analysis import (
    analyze_articles,
    build_rule_report,
    build_stats,
    build_trend,
    clean_text,
    events_from_seed,
)
from ai_processor import enrich_with_ai
from translator import apply_translations
from config import (
    ASSETS_DIR,
    DATA_DIR,
    FEAR_GREED_URL,
    GLOBAL_MARKET_URL,
    HTTP_TIMEOUT,
    MARKET_URL,
    MAX_EVENTS,
    POLYMARKET_URL,
    REPORTS_DIR,
    RSS_SOURCES,
    USER_AGENT,
)

CRYPTO_PREDICTION_KEYWORDS = [
    "bitcoin", "btc", "ethereum", "eth", "crypto", "etf", "stablecoin",
    "solana", "xrp", "blockchain", "defi", "coinbase", "binance", "sec",
]
MACRO_PREDICTION_KEYWORDS = ["fed", "interest rate", "inflation", "treasury"]


def prediction_keyword_hits(question: str, keywords: list[str]) -> int:
    lowered = question.lower()
    hits = 0
    for keyword in keywords:
        if len(keyword) <= 4:
            if re.search(rf"\b{re.escape(keyword)}\b", lowered):
                hits += 1
        elif keyword in lowered:
            hits += 1
    return hits


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    value = value.strip()
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        pass
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def fetch_url(url: str, accept: str = "*/*") -> bytes:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": accept,
                    "Cache-Control": "no-cache",
                },
            )
            with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt == 0:
                time.sleep(0.7)
    raise last_error or RuntimeError("Unknown network error")


def fetch_json(url: str) -> Any:
    return json.loads(fetch_url(url, "application/json").decode("utf-8"))


def child_text(node: ET.Element, names: set[str]) -> str:
    for child in list(node):
        local = child.tag.rsplit("}", 1)[-1].lower()
        if local in names:
            text = " ".join(part.strip() for part in child.itertext() if part.strip())
            if text:
                return text
    return ""


def atom_link(node: ET.Element) -> str:
    for child in list(node):
        local = child.tag.rsplit("}", 1)[-1].lower()
        if local == "link":
            href = child.attrib.get("href", "")
            rel = child.attrib.get("rel", "alternate")
            if href and rel in {"alternate", "self", ""}:
                return href
    return ""


def parse_feed(payload: bytes, source_name: str, feed_url: str) -> list[dict[str, Any]]:
    root = ET.fromstring(payload)
    nodes = root.findall(".//item")
    is_atom = False
    if not nodes:
        nodes = root.findall(".//{http://www.w3.org/2005/Atom}entry")
        is_atom = bool(nodes)

    now = utc_now()
    articles: list[dict[str, Any]] = []
    for node in nodes[:12]:
        title = child_text(node, {"title"})
        description = child_text(node, {"description", "summary", "content", "encoded"})
        link = child_text(node, {"link"})
        if is_atom or not link:
            link = atom_link(node) or link
        published_raw = child_text(node, {"pubdate", "published", "updated", "date", "created"})
        published = parse_datetime(published_raw) or now
        if published > now + timedelta(minutes=5):
            published = now
        if published < now - timedelta(days=8):
            continue
        title = clean_text(title, 240)
        if not title:
            continue
        if not link.startswith("http"):
            link = feed_url
        description = clean_text(description, 800) or title
        articles.append(
            {
                "title": title,
                "summary": description,
                "url": link,
                "source_name": source_name,
                "feed_url": feed_url,
                "published_at": published,
            }
        )
    return articles


def collect_articles() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    articles: list[dict[str, Any]] = []
    source_status: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()

    for source in RSS_SOURCES:
        name, url = source["name"], source["url"]
        try:
            payload = fetch_url(url, "application/rss+xml, application/xml, text/xml")
            parsed = parse_feed(payload, name, url)
            added = 0
            for article in parsed:
                title_key = re.sub(r"\W+", "", article["title"].lower())[:120]
                if article["url"] in seen_urls or title_key in seen_titles:
                    continue
                seen_urls.add(article["url"])
                seen_titles.add(title_key)
                articles.append(article)
                added += 1
            source_status.append(
                {
                    "name": name,
                    "type": "RSS",
                    "url": url,
                    "status": "ok",
                    "item_count": added,
                    "error": "",
                }
            )
            print(f"[RSS] {name}: {added} items")
        except Exception as exc:  # noqa: BLE001 - one source must not stop the run
            source_status.append(
                {
                    "name": name,
                    "type": "RSS",
                    "url": url,
                    "status": "error",
                    "item_count": 0,
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )
            print(f"[RSS] {name}: skipped ({type(exc).__name__})")
    return articles, source_status


def _number(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_market(seed: dict[str, Any], source_status: list[dict[str, Any]]) -> dict[str, Any]:
    coins: dict[str, dict[str, Any]] = {}
    try:
        rows = fetch_json(MARKET_URL)
        by_id = {row.get("id"): row for row in rows if isinstance(row, dict)}
        for coin_id, symbol in (("bitcoin", "BTC"), ("ethereum", "ETH"), ("solana", "SOL")):
            row = by_id.get(coin_id, {})
            coins[symbol.lower()] = {
                "symbol": symbol,
                "price": _number(row.get("current_price")),
                "change_24h": _number(row.get("price_change_percentage_24h")),
            }
        source_status.append(
            {
                "name": "CoinGecko",
                "type": "Market API",
                "url": "https://www.coingecko.com/",
                "status": "ok",
                "item_count": len(coins),
                "error": "",
            }
        )
        print(f"[Market] CoinGecko: {len(coins)} assets")
    except Exception as exc:  # noqa: BLE001
        coins = {}
        source_status.append(
            {
                "name": "CoinGecko",
                "type": "Market API",
                "url": "https://www.coingecko.com/",
                "status": "error",
                "item_count": 0,
                "error": f"{type(exc).__name__}: {exc}",
            }
        )
        print(f"[Market] CoinGecko skipped: {type(exc).__name__}")

    fear_greed: dict[str, Any] = {}
    try:
        fng_rows = fetch_json(FEAR_GREED_URL).get("data", [])
        if fng_rows:
            fear_greed = {
                "value": int(fng_rows[0].get("value", 50)),
                "label": fng_rows[0].get("value_classification", "Neutral"),
            }
    except Exception:
        fear_greed = {}

    global_market: dict[str, Any] = {}
    try:
        global_data = fetch_json(GLOBAL_MARKET_URL).get("data", {})
        global_market = {
            "global_market_cap": _number(global_data.get("total_market_cap", {}).get("usd")),
            "market_cap_change_24h": _number(global_data.get("market_cap_change_percentage_24h_usd")),
        }
    except Exception:
        global_market = {}

    if not coins:
        fallback = copy.deepcopy(seed.get("market", {}))
        fallback["is_demo"] = True
        return fallback

    if not fear_greed:
        fear_greed = {"value": None, "label": "Unavailable"}
    return {
        "btc": coins.get("btc", {"symbol": "BTC", "price": None, "change_24h": None}),
        "eth": coins.get("eth", {"symbol": "ETH", "price": None, "change_24h": None}),
        "sol": coins.get("sol", {"symbol": "SOL", "price": None, "change_24h": None}),
        "fear_greed": fear_greed,
        "global_market_cap": global_market.get("global_market_cap"),
        "market_cap_change_24h": global_market.get("market_cap_change_24h"),
        "is_demo": False,
    }


def _parse_jsonish(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


def fetch_predictions(seed: dict[str, Any], source_status: list[dict[str, Any]]) -> list[dict[str, Any]]:
    try:
        rows = fetch_json(POLYMARKET_URL)
        found: list[dict[str, Any]] = []
        for row in rows:
            question = clean_text(str(row.get("question", "")), 180)
            lowered = question.lower()
            crypto_hits = prediction_keyword_hits(question, CRYPTO_PREDICTION_KEYWORDS)
            macro_hits = prediction_keyword_hits(question, MACRO_PREDICTION_KEYWORDS)
            if not question or (crypto_hits == 0 and macro_hits == 0):
                continue
            outcomes = _parse_jsonish(row.get("outcomes"))
            prices = _parse_jsonish(row.get("outcomePrices"))
            probability = None
            if prices:
                try:
                    probability = round(float(prices[0]) * 100)
                except (TypeError, ValueError):
                    probability = None
            events = row.get("events") if isinstance(row.get("events"), list) else []
            slug = events[0].get("slug") if events and isinstance(events[0], dict) else row.get("slug")
            found.append(
                {
                    "question": question,
                    "probability": probability,
                    "outcome": str(outcomes[0]) if outcomes else "Yes",
                    "volume": _number(row.get("volume24hr")) or _number(row.get("volumeNum")) or 0,
                    "url": f"https://polymarket.com/event/{slug}" if slug else "https://polymarket.com/",
                    "end_date": row.get("endDate"),
                    "relevance": crypto_hits * 10 + macro_hits,
                    "is_demo": False,
                }
            )
        found.sort(key=lambda market: (market.get("relevance", 0), market["volume"]), reverse=True)
        found = found[:4]
        source_status.append(
            {
                "name": "Polymarket",
                "type": "Prediction Market",
                "url": "https://polymarket.com/",
                "status": "ok",
                "item_count": len(found),
                "error": "",
            }
        )
        print(f"[Prediction] Polymarket: {len(found)} crypto/macro markets")
        if found:
            return found
    except Exception as exc:  # noqa: BLE001
        source_status.append(
            {
                "name": "Polymarket",
                "type": "Prediction Market",
                "url": "https://polymarket.com/",
                "status": "error",
                "item_count": 0,
                "error": f"{type(exc).__name__}: {exc}",
            }
        )
        print(f"[Prediction] Polymarket skipped: {type(exc).__name__}")

    fallback = copy.deepcopy(seed.get("prediction_markets", []))
    for market in fallback:
        market["is_demo"] = True
    return fallback


def load_seed() -> dict[str, Any]:
    seed_path = DATA_DIR / "seed_events.json"
    return json.loads(seed_path.read_text(encoding="utf-8"))


def apply_ai(
    events: list[dict[str, Any]],
    market: dict[str, Any],
    mode: str,
    allow_ai: bool,
) -> dict[str, Any]:
    report = build_rule_report(events, market, mode)
    if allow_ai:
        ai_result = enrich_with_ai(events, market)
        if ai_result:
            notes = ai_result.get("event_notes", {})
            for event in events:
                note = notes.get(event["id"], {}) if isinstance(notes, dict) else {}
                if isinstance(note, dict):
                    if note.get("analysis"):
                        event["analysis"] = str(note["analysis"]).strip()
                    if note.get("risk_reason"):
                        event["risk_reason"] = str(note["risk_reason"]).strip()
            report.update(
                {
                    "headline": ai_result["headline"],
                    "summary": ai_result["summary"],
                    "risk_outlook": ai_result["risk_outlook"],
                    "actions": ai_result["actions"] or report["actions"],
                    "ai_used": True,
                    "generated_by": "AI",
                    "model": ai_result.get("model"),
                }
            )
            print(f"[AI] analysis ready via {ai_result.get('model')}")
    return report


def write_outputs(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    serialized = json.dumps(data, ensure_ascii=False, indent=2)
    (DATA_DIR / "latest.json").write_text(serialized + "\n", encoding="utf-8")
    js_payload = "window.LATEST_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
    (ASSETS_DIR / "latest-data.js").write_text(js_payload, encoding="utf-8")

    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    (REPORTS_DIR / f"{stamp}.json").write_text(serialized + "\n", encoding="utf-8")
    print(f"[Write] data/latest.json ({len(data['events'])} events)")
    print(f"[Write] assets/latest-data.js")


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect Web3 signals and build dashboard JSON.")
    parser.add_argument("--demo", action="store_true", help="Use offline seed data without network access.")
    parser.add_argument("--no-ai", action="store_true", help="Skip optional AI enrichment.")
    args = parser.parse_args()

    generated_at = utc_now()
    seed = load_seed()
    source_status: list[dict[str, Any]] = []

    if args.demo:
        articles: list[dict[str, Any]] = []
        print("[Mode] offline demo")
    else:
        print("[Mode] live collection")
        articles, source_status = collect_articles()

    if articles:
        events = analyze_articles(articles, MAX_EVENTS)
        mode = "live"
        notice = "数据来自公开 RSS 与 API，事件聚类、热度与风险评分由规则引擎生成。"
    else:
        events = events_from_seed(seed)
        mode = "demo"
        notice = seed.get("notice", "当前为演示快照。")

    market = fetch_market(seed, source_status)
    prediction_markets = fetch_predictions(seed, source_status)
    now = utc_now()
    active_sources = len(
        {
            source["name"]
            for source in source_status
            if source.get("status") == "ok" and source.get("item_count", 0) > 0
        }
    )
    if mode == "demo" and not active_sources:
        active_sources = 0

    apply_translations(events, prediction_markets)
    report = apply_ai(events, market, mode, allow_ai=not args.no_ai)
    report["generated_at"] = iso(now)
    report["mode"] = mode

    data = {
        "version": "0.1.0",
        "generated_at": iso(now),
        "mode": mode,
        "notice": notice,
        "events": events,
        "market": market,
        "prediction_markets": prediction_markets,
        "report": report,
        "stats": build_stats(events, len(articles) if articles else sum(len(event["sources"]) for event in events), active_sources),
        "trend": build_trend(events, now),
        "sources": source_status,
        "methodology": {
            "heat": "热度 = 新鲜度 + 来源数量 + 风险/情绪关键词信号",
            "risk": "风险 = 高风险词 + 负面情绪 + 来源数量 + 监管/安全类别加权",
            "sentiment": "情绪指数 0-100；数值越低代表越偏负面",
            "ai": "AI 可选；未配置 Key 时使用规则引擎，不会影响网站运行",
        },
        "update_hint": "建议每 2 小时运行一次采集脚本；上线后由 GitHub Actions 或服务器 cron 自动执行。",
    }
    write_outputs(data)
    print(f"[Done] mode={mode}, events={len(events)}, sources={active_sources}")
    if mode == "demo":
        print("[Tip] 当前是演示数据。网络恢复后运行 python scripts/collect.py 即可抓取真实来源。")
    return 0


if __name__ == "__main__":
    sys.exit(main())


