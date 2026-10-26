"""Lightweight rule-based clustering and Web3 risk scoring."""

from __future__ import annotations

import hashlib
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from typing import Any

STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "after",
    "before", "about", "will", "could", "would", "says", "said", "new",
    "crypto", "cryptocurrency", "blockchain", "market", "markets", "news",
    "report", "reports", "amid", "over", "under", "its", "has", "have",
    "was", "were", "are", "not", "you", "your", "their", "they", "more",
}

CATEGORY_RULES: dict[str, list[str]] = {
    "监管": [
        "sec", "regulator", "regulation", "regulatory", "lawsuit", "law", "policy",
        "compliance", "congress", "senate", "stablecoin", "etf", "legal", "court",
        "监管", "合规", "诉讼", "政策", "法案", "法院", "证券",
    ],
    "安全": [
        "hack", "hacked", "exploit", "breach", "vulnerability", "scam", "fraud",
        "phishing", "outage", "attack", "stolen", "drain", "security", "audit",
        "黑客", "漏洞", "攻击", "诈骗", "安全", "宕机", "被盗", "审计",
    ],
    "预测市场": [
        "polymarket", "kalshi", "prediction market", "odds", "probability",
        "forecast", "betting", "wager", "预测市场", "赔率", "盘口", "概率",
    ],
    "社区": [
        "community", "airdrop", "governance", "dao", "user", "users", "token holder",
        "community", "社区", "空投", "治理", "用户", "持有者", "投票",
    ],
    "市场": [
        "price", "etf", "inflow", "outflow", "liquidation", "rally", "surge", "drop",
        "plunge", "bullish", "bearish", "volume", "funding", "trading", "custody",
        "价格", "资金", "流入", "流出", "清算", "上涨", "下跌", "交易", "托管",
    ],
    "技术": [
        "upgrade", "network", "protocol", "developer", "ai", "layer", "rollup",
        "infrastructure", "mainnet", "testnet", "node", "rpc", "wallet",
        "升级", "网络", "协议", "开发者", "基础设施", "主网", "节点", "钱包",
    ],
}

HIGH_RISK_TERMS = [
    "hack", "hacked", "exploit", "breach", "stolen", "drain", "fraud", "scam",
    "lawsuit", "sue", "ban", "sanction", "investigation", "probe", "warning",
    "liquidation", "bankruptcy", "outage", "attack", "vulnerability", "security",
    "黑客", "攻击", "被盗", "诈骗", "诉讼", "制裁", "调查", "警告", "清算",
    "破产", "宕机", "漏洞", "安全风险",
]
NEGATIVE_TERMS = HIGH_RISK_TERMS + [
    "crash", "plunge", "drop", "fall", "decline", "bearish", "fear", "risk",
    "concern", "uncertainty", "loss", "negative", "pressure", "restricted",
    "暴跌", "下跌", "风险", "担忧", "不确定", "亏损", "负面", "压力",
]
POSITIVE_TERMS = [
    "surge", "rally", "gain", "rise", "approve", "approved", "partnership",
    "launch", "launched", "upgrade", "bullish", "adoption", "growth", "record",
    "boost", "support", "recover", "recovery", "positive",
    "上涨", "反弹", "批准", "合作", "上线", "升级", "增长", "恢复",
]

ENTITY_TERMS = [
    "Bitcoin", "BTC", "Ethereum", "ETH", "Solana", "SOL", "XRP", "BNB",
    "Coinbase", "Binance", "OKX", "Kraken", "Circle", "Tether", "USDC", "USDT",
    "Polymarket", "Kalshi", "SEC", "CFTC", "ETF", "DAO", "DeFi", "Layer 2",
    "AI Agent", "Stablecoin", "BlackRock", "MicroStrategy",
]

TAG_TERMS = {
    "监管": ["监管", "SEC", "ETF", "合规"],
    "安全": ["安全", "漏洞", "黑客", "审计"],
    "市场": ["价格", "资金流", "ETF", "机构"],
    "预测市场": ["Polymarket", "Kalshi", "赔率"],
    "社区": ["社区", "空投", "治理", "用户反馈"],
    "技术": ["升级", "开发者", "基础设施"],
    "交易所": ["交易所", "流动性", "风控"],
}

RISK_LABELS = {
    "critical": "极高",
    "high": "高",
    "medium": "中",
    "low": "低",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def clean_text(value: str, limit: int | None = None) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if limit and len(text) > limit:
        return text[: limit - 1].rstrip() + "…"
    return text


def title_tokens(value: str) -> set[str]:
    text = value.lower()
    tokens = re.findall(r"[a-z0-9]{3,}", text)
    return {token for token in tokens if token not in STOPWORDS}


def similarity(left: str, right: str) -> float:
    a = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", " ", left.lower()).strip()
    b = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", " ", right.lower()).strip()
    if not a or not b:
        return 0.0
    seq = SequenceMatcher(None, a, b).ratio()
    tokens_a, tokens_b = title_tokens(a), title_tokens(b)
    union = tokens_a | tokens_b
    jaccard = len(tokens_a & tokens_b) / len(union) if union else 0.0
    return 0.58 * seq + 0.42 * jaccard


def cluster_articles(articles: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    clusters: list[list[dict[str, Any]]] = []
    for article in sorted(articles, key=lambda item: item["published_at"], reverse=True):
        best_index = None
        best_score = 0.0
        for index, cluster in enumerate(clusters):
            score = similarity(article["title"], cluster[0]["title"])
            if score > best_score:
                best_index, best_score = index, score
        if best_index is not None and best_score >= 0.56:
            clusters[best_index].append(article)
        else:
            clusters.append([article])
    return clusters


def _matches(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    found = []
    for term in terms:
        if term.lower() in lowered and term not in found:
            found.append(term)
    return found


def pick_category(text: str) -> str:
    scores = {category: len(_matches(text, terms)) for category, terms in CATEGORY_RULES.items()}
    category, score = max(scores.items(), key=lambda item: item[1])
    return category if score else "行业"


def sentiment_and_risk(text: str, source_count: int, category: str) -> tuple[int, int, str]:
    negative = _matches(text, NEGATIVE_TERMS)
    positive = _matches(text, POSITIVE_TERMS)
    high_risk = _matches(text, HIGH_RISK_TERMS)
    raw = (len(positive) - len(negative)) / (len(positive) + len(negative) + 2)
    sentiment = max(5, min(95, round(50 + raw * 42)))
    risk = 26 + min(32, len(high_risk) * 7) + min(18, len(negative) * 3) + min(12, source_count * 3)
    if category in {"监管", "安全"}:
        risk += 8
    if sentiment < 38:
        risk += 7
    if not high_risk and sentiment >= 50:
        risk -= 5
    return sentiment, max(8, min(98, risk)), ", ".join(high_risk) or "未发现强风险词"


def heat_score(published_at: datetime, source_count: int, text: str, now: datetime) -> int:
    age_hours = max(0.0, (now - published_at).total_seconds() / 3600)
    recency = 34 if age_hours <= 2 else 28 if age_hours <= 6 else 20 if age_hours <= 12 else 12 if age_hours <= 24 else 3
    signals = len(_matches(text, NEGATIVE_TERMS + POSITIVE_TERMS))
    heat = 20 + recency + min(24, source_count * 8) + min(12, signals * 2)
    return max(10, min(98, heat))


def risk_level(risk: int) -> tuple[str, str]:
    if risk >= 75:
        return "critical", RISK_LABELS["critical"]
    if risk >= 58:
        return "high", RISK_LABELS["high"]
    if risk >= 40:
        return "medium", RISK_LABELS["medium"]
    return "low", RISK_LABELS["low"]


def make_event(cluster: list[dict[str, Any]], now: datetime) -> dict[str, Any]:
    primary = max(cluster, key=lambda item: len(item.get("summary", "")))
    combined = " ".join(
        f"{item.get('title', '')} {item.get('summary', '')}" for item in cluster
    )
    category = pick_category(combined)
    sentiment, risk, risk_reason = sentiment_and_risk(combined, len(cluster), category)
    heat = heat_score(primary["published_at"], len(cluster), combined, now)
    level, level_label = risk_level(risk)
    sources = []
    seen_urls = set()
    for item in sorted(cluster, key=lambda source: source["published_at"], reverse=True):
        if item["url"] in seen_urls:
            continue
        seen_urls.add(item["url"])
        sources.append(
            {
                "name": item["source_name"],
                "url": item["url"],
                "published_at": item["published_at"].isoformat().replace("+00:00", "Z"),
            }
        )
    entities = [entity for entity in ENTITY_TERMS if entity.lower() in combined.lower()][:8]
    base_tags = TAG_TERMS.get(category, [category])
    tags = list(dict.fromkeys([category, *base_tags, *entities]))[:6]
    title = clean_text(primary["title"], 180)
    summary = clean_text(primary.get("summary") or title, 480)
    analysis = (
        f"该事件被归类为「{category}」，当前热度 {heat}、风险 {risk}。"
        f"主要风险信号为：{risk_reason}。建议结合后续来源变化持续观察。"
    )
    event_id = hashlib.sha1(f"{title}|{sources[0]['url'] if sources else ''}".encode("utf-8")).hexdigest()[:12]
    return {
        "id": event_id,
        "title": title,
        "summary": summary,
        "category": category,
        "sentiment": sentiment,
        "risk": risk,
        "heat": heat,
        "risk_level": level,
        "risk_label": level_label,
        "tags": tags,
        "entities": entities,
        "source_count": len(sources),
        "sources": sources,
        "published_at": max(item["published_at"] for item in cluster).isoformat().replace("+00:00", "Z"),
        "status": "new" if (now - primary["published_at"]).total_seconds() < 21600 else "developing",
        "analysis": analysis,
        "risk_reason": risk_reason,
        "is_demo": False,
    }


def analyze_articles(articles: list[dict[str, Any]], max_events: int) -> list[dict[str, Any]]:
    now = utc_now()
    clusters = cluster_articles(articles)
    events = [make_event(cluster, now) for cluster in clusters]
    events.sort(key=lambda event: (event["heat"] * 0.58 + event["risk"] * 0.42), reverse=True)
    return events[:max_events]


def _parse_age(value: Any, fallback: float) -> datetime:
    try:
        hours = float(value)
    except (TypeError, ValueError):
        hours = fallback
    return utc_now() - timedelta(hours=max(0.0, hours))


def events_from_seed(seed: dict[str, Any]) -> list[dict[str, Any]]:
    events = []
    for item in seed.get("events", []):
        published = _parse_age(item.get("age_hours"), 8)
        sources = []
        for source in item.get("sources", []):
            sources.append(
                {
                    "name": source.get("name", "Demo source"),
                    "url": source.get("url", "https://example.com/"),
                    "published_at": _parse_age(source.get("age_hours"), item.get("age_hours", 8))
                    .isoformat()
                    .replace("+00:00", "Z"),
                }
            )
        risk = int(item.get("risk", 45))
        level, level_label = risk_level(risk)
        event_id = hashlib.sha1(item["title"].encode("utf-8")).hexdigest()[:12]
        events.append(
            {
                "id": event_id,
                "title": item["title"],
                "summary": item["summary"],
                "category": item.get("category", "行业"),
                "sentiment": int(item.get("sentiment", 50)),
                "risk": risk,
                "heat": int(item.get("heat", 50)),
                "risk_level": level,
                "risk_label": level_label,
                "tags": item.get("tags", []),
                "entities": item.get("entities", []),
                "source_count": len(sources),
                "sources": sources,
                "published_at": published.isoformat().replace("+00:00", "Z"),
                "status": "new" if (utc_now() - published).total_seconds() < 21600 else "developing",
                "analysis": item.get("analysis")
                or f"当前为演示快照。该事件属于「{item.get('category', '行业')}」，"
                f"风险等级为 {level_label}，主要用于展示产品界面和分析流程。",
                "risk_reason": item.get("risk_reason", "演示数据，不构成真实事件判断"),
                "is_demo": True,
            }
        )
    events.sort(key=lambda event: (event["heat"] * 0.58 + event["risk"] * 0.42), reverse=True)
    return events


def build_trend(events: list[dict[str, Any]], now: datetime) -> dict[str, Any]:
    bins = [0.0] * 6
    for event in events:
        try:
            published = datetime.fromisoformat(event["published_at"].replace("Z", "+00:00"))
        except (ValueError, TypeError):
            continue
        age = max(0.0, (now - published).total_seconds() / 3600)
        if age < 24:
            index = min(5, int(age // 4))
            bins[5 - index] += event["heat"] / 100
    maximum = max(bins) or 1
    normalized = [round(18 + (value / maximum) * 82) for value in bins]
    return {
        "values": normalized,
        "labels": ["24h前", "20h", "16h", "12h", "8h", "现在"],
    }


def build_stats(events: list[dict[str, Any]], scanned_items: int, active_sources: int) -> dict[str, Any]:
    if events:
        sentiment_index = round(sum(event["sentiment"] for event in events) / len(events))
        risk_index = round(sum(event["risk"] for event in events) / len(events))
    else:
        sentiment_index = 50
        risk_index = 0
    categories = Counter(event["category"] for event in events)
    return {
        "event_count": len(events),
        "scanned_items": scanned_items,
        "high_risk_count": sum(1 for event in events if event["risk"] >= 58),
        "critical_count": sum(1 for event in events if event["risk"] >= 75),
        "sentiment_index": sentiment_index,
        "risk_index": risk_index,
        "source_count": active_sources,
        "category_count": len(categories),
        "top_category": categories.most_common(1)[0][0] if categories else "暂无",
    }


def build_rule_report(events: list[dict[str, Any]], market: dict[str, Any], mode: str) -> dict[str, Any]:
    top = sorted(events, key=lambda event: event["risk"] * 0.6 + event["heat"] * 0.4, reverse=True)[:3]
    high_risk = [event for event in events if event["risk"] >= 58]
    category_headlines = {
        "监管": "监管与合规信号升温，关注政策口径与机构反应",
        "安全": "安全风险信号升温，优先核查漏洞与资金安全事件",
        "市场": "市场情绪出现分化，关注资金流向与短期波动",
        "预测市场": "预测市场活跃度上升，关注赔率与流动性变化",
        "社区": "社区舆情升温，关注用户反馈与信任风险",
        "技术": "技术叙事升温，关注升级与开发者动向",
        "行业": "Web3 热点信号升温，建议持续跟踪来源变化",
    }
    if top:
        lead = top[0]
        headline = category_headlines.get(lead["category"], category_headlines["行业"])
    else:
        headline = "当前没有足够的新事件，继续观察公开数据源"
    high_text = "、".join(event["category"] for event in high_risk[:3]) or "暂未形成集中高风险事件"
    summary = (
        f"本轮扫描共形成 {len(events)} 个事件，其中 {len(high_risk)} 个达到高风险阈值。"
        f"当前关注重点集中在{high_text}。"
        if events
        else "本轮未获取到可用事件，请检查数据源或先使用演示模式。"
    )
    btc_change = market.get("btc", {}).get("change_24h")
    market_text = (
        f"BTC 24 小时变化约 {btc_change:+.2f}%"
        if isinstance(btc_change, (int, float))
        else "市场行情暂不可用"
    )
    actions = [
        "优先核查高风险事件的多来源一致性，并确认是否出现新的官方回应。",
        "将高热度事件加入下一轮监控清单，观察 2～6 小时内传播速度变化。",
        f"结合预测市场与 {market_text}，判断是否存在可跟踪的交易或运营机会。",
    ]
    notes = {}
    for event in events[:12]:
        notes[event["id"]] = {
            "analysis": event.get("analysis", ""),
            "risk_reason": event.get("risk_reason", ""),
        }
    return {
        "headline": headline,
        "summary": summary,
        "risk_outlook": (
            f"当前平均风险指数为 {round(sum(event['risk'] for event in events) / len(events)) if events else 0}。"
            "建议重点关注监管、安全与社区情绪叠加的事件，并在下一轮更新时复核。"
        ),
        "actions": actions,
        "event_notes": notes,
        "ai_used": False,
        "generated_by": "规则引擎",
        "mode": mode,
    }


