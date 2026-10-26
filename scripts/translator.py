"""Cached Chinese translation for event titles, summaries and market questions.

Stable and low-cost by design:
- Existing translations are loaded from data/translation_cache.json.
- Only unseen text is sent to the configured OpenAI-compatible model.
- If no AI key is configured, cached translations still work.
"""

from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.request
from typing import Any

from config import AI_API_KEY, AI_BASE_URL, AI_MODEL, DATA_DIR, HTTP_TIMEOUT, USER_AGENT

CACHE_PATH = DATA_DIR / "translation_cache.json"


def _cache_key(text: str) -> str:
    return hashlib.sha1(text.strip().encode("utf-8")).hexdigest()


def _load_cache() -> dict[str, dict[str, str]]:
    if not CACHE_PATH.exists():
        return {"title": {}, "summary": {}, "market": {}}
    try:
        raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raw = {}
    return {"title": raw.get("title", {}), "summary": raw.get("summary", {}), "market": raw.get("market", {})}


def _save_cache(cache: dict[str, dict[str, str]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("No JSON object in translation response")
    return json.loads(cleaned[start : end + 1])


def _translate_missing(items: list[tuple[str, str]], kind: str) -> dict[str, str]:
    if not items or not AI_API_KEY:
        return {}
    kind_hint = {
        "title": "这些是 Web3 新闻标题，请译成简洁、准确的中文标题。",
        "summary": "这些是 Web3 新闻摘要，请译成 1-3 句简体中文摘要，不添加原文没有的事实。",
        "market": "这些是预测市场问题，请译成清楚的简体中文问句，保留币种、机构、日期和数字。",
    }[kind]
    numbered = [{"index": index, "text": text} for index, (_, text) in enumerate(items)]
    prompt = f"""{kind_hint}
请只输出严格合法的 JSON，不要 Markdown：
{{"translations":[{{"index":0,"text":"中文翻译"}}]}}

输入：
{json.dumps(numbered, ensure_ascii=False)}
"""
    payload = {
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": "你是专业的 Web3 财经新闻译者，只做忠实翻译，不添加事实。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 5000,
    }
    request = urllib.request.Request(
        f"{AI_BASE_URL}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=max(HTTP_TIMEOUT, 60)) as response:
            body = json.loads(response.read().decode("utf-8"))
        parsed = _extract_json(body["choices"][0]["message"]["content"])
        result: dict[str, str] = {}
        for item in parsed.get("translations", []):
            index = int(item.get("index", -1))
            text = str(item.get("text", "")).strip()
            if 0 <= index < len(items) and text:
                result[items[index][0]] = text
        return result
    except (urllib.error.URLError, TimeoutError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        print(f"[Translate] skipped: {type(exc).__name__}: {exc}")
        return {}


def translate_text(text: str, kind: str, cache: dict[str, dict[str, str]], new_items: dict[str, tuple[str, str]]) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    key = _cache_key(text)
    if key in cache[kind]:
        return cache[kind][key]
    new_items[key] = (kind, text)
    return ""


def apply_translations(events: list[dict[str, Any]], markets: list[dict[str, Any]]) -> None:
    cache = _load_cache()
    pending: dict[str, tuple[str, str]] = {}
    for event in events:
        title_zh = translate_text(event.get("title", ""), "title", cache, pending)
        summary_zh = translate_text(event.get("summary", ""), "summary", cache, pending)
        if title_zh:
            event["title_zh"] = title_zh
        if summary_zh:
            event["summary_zh"] = summary_zh
    for market in markets:
        question_zh = translate_text(market.get("question", ""), "market", cache, pending)
        if question_zh:
            market["question_zh"] = question_zh

    if pending:
        print(f"[Translate] {len(pending)} strings need Chinese translation")
        by_kind: dict[str, list[tuple[str, str]]] = {"title": [], "summary": [], "market": []}
        for key, (kind, text) in pending.items():
            by_kind[kind].append((key, text))
        translated: dict[str, str] = {}
        for kind, items in by_kind.items():
            translated.update(_translate_missing(items, kind))
        if translated:
            for key, text in translated.items():
                cache[pending[key][0]][key] = text
            _save_cache(cache)
            for event in events:
                title_key = _cache_key(event.get("title", ""))
                summary_key = _cache_key(event.get("summary", ""))
                if title_key in cache["title"]:
                    event["title_zh"] = cache["title"][title_key]
                if summary_key in cache["summary"]:
                    event["summary_zh"] = cache["summary"][summary_key]
            for market in markets:
                question_key = _cache_key(market.get("question", ""))
                if question_key in cache["market"]:
                    market["question_zh"] = cache["market"][question_key]
            print(f"[Translate] {len(translated)} strings translated and cached")
    else:
        print("[Translate] cache hit for all current text")
