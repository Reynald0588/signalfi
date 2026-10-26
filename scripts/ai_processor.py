"""Optional OpenAI-compatible AI enrichment.

The rest of the project works without an API key. If AI_API_KEY is present,
only the most important event summaries are sent to the configured model.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from config import AI_API_KEY, AI_BASE_URL, AI_MAX_EVENTS, AI_MODEL, HTTP_TIMEOUT, USER_AGENT


def _extract_json(text: str) -> dict[str, Any]:
    """Accept plain JSON or JSON wrapped in a markdown code fence."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "", 1).replace("```", "", 1).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("AI response did not contain a JSON object")
    return json.loads(cleaned[start : end + 1])


def _as_text(value: Any, fallback: str = "") -> str:
    return value.strip() if isinstance(value, str) and value.strip() else fallback


def enrich_with_ai(events: list[dict[str, Any]], market: dict[str, Any]) -> dict[str, Any] | None:
    """Return normalized AI output, or None when AI is unavailable."""
    if not AI_API_KEY:
        return None

    compact_events = []
    for event in events[:AI_MAX_EVENTS]:
        compact_events.append(
            {
                "id": event["id"],
                "title": event["title"],
                "summary": event["summary"][:500],
                "category": event["category"],
                "sentiment": event["sentiment"],
                "risk": event["risk"],
                "tags": event["tags"],
                "source_count": event["source_count"],
                "sources": [source["name"] for source in event["sources"][:5]],
            }
        )

    prompt = f"""
你是一名 Web3 舆情分析员，服务对象是交易所运营、舆情监测和预测市场团队。
请只依据下面提供的事件标题、摘要和来源信息进行分析，不要编造新闻、数据或来源。

市场快照（仅供参考）：
{json.dumps(market, ensure_ascii=False)}

事件列表：
{json.dumps(compact_events, ensure_ascii=False)}

请输出一个严格合法的 JSON 对象，不要输出 Markdown，结构必须是：
{{
  "headline": "今日最重要的一句话判断，20-40字",
  "summary": "80-160字的中文舆情概览，指出最值得关注的风险和机会",
  "risk_outlook": "40-100字的风险展望",
  "actions": ["给运营/舆情团队的具体动作，2-4条"],
  "event_notes": {{
    "事件id": {{
      "analysis": "针对该事件的40-90字分析",
      "risk_reason": "该风险等级的主要依据，20-50字"
    }}
  }}
}}

要求：
1. 语气专业、克制，不要夸大。
2. 不得虚构事件事实；信息不足时写“需持续观察”。
3. 风险判断要结合负面情绪、来源数量、事件类型和传播热度。
4. 所有事件 id 必须来自输入。
""".strip()

    payload = {
        "model": AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "你输出严格 JSON，擅长 Web3 舆情、风险判断和预测市场分析。",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1800,
    }
    request = urllib.request.Request(
        f"{AI_BASE_URL}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=max(HTTP_TIMEOUT, 45)) as response:
            body = json.loads(response.read().decode("utf-8"))
        content = body["choices"][0]["message"]["content"]
        parsed = _extract_json(content)
    except (urllib.error.URLError, TimeoutError, KeyError, ValueError, json.JSONDecodeError) as exc:
        print(f"[AI] skipped: {type(exc).__name__}: {exc}")
        return None

    event_notes = parsed.get("event_notes")
    if not isinstance(event_notes, dict):
        event_notes = {}
    actions = parsed.get("actions")
    if not isinstance(actions, list):
        actions = []
    actions = [str(item).strip() for item in actions if str(item).strip()][:4]

    return {
        "headline": _as_text(parsed.get("headline"), "今日 Web3 舆情信号需要持续观察"),
        "summary": _as_text(parsed.get("summary"), "当前事件主要集中在监管、安全与市场情绪变化，建议持续关注高热度事件。"),
        "risk_outlook": _as_text(parsed.get("risk_outlook"), "风险仍处于动态变化中，需结合后续来源更新判断。"),
        "actions": actions,
        "event_notes": event_notes,
        "model": AI_MODEL,
        "provider": AI_BASE_URL,
        "ai_used": True,
    }
