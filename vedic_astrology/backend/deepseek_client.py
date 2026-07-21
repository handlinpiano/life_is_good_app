"""
DeepSeek API client helpers (OpenAI-compatible SDK).

Docs (2026): https://api-docs.deepseek.com/
- base_url: https://api.deepseek.com
- models: deepseek-v4-flash, deepseek-v4-pro
  (deepseek-chat / deepseek-reasoner deprecated 2026-07-24 → flash non-thinking / flash thinking)
- thinking: extra_body={"thinking": {"type": "enabled"|"disabled"}}
- reasoning_effort: "high" | "max" (when thinking is on)
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal, Optional

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

DEFAULT_BASE_URL = "https://api.deepseek.com"
# Fast default for chat / daily tips; heavy interpretation can override to pro
DEFAULT_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
DEFAULT_REASONING_MODEL = os.getenv("DEEPSEEK_REASONING_MODEL", "deepseek-v4-pro")
DEFAULT_TIMEOUT = float(os.getenv("DEEPSEEK_TIMEOUT", "180"))
DEFAULT_MAX_RETRIES = int(os.getenv("DEEPSEEK_MAX_RETRIES", "2"))

ReasoningEffort = Literal["high", "max"]


@dataclass
class DeepSeekResult:
    content: Optional[str]
    reasoning: Optional[str]
    model: str
    finish_reason: Optional[str] = None
    usage: Optional[dict] = None
    raw_message: Any = None


@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    """Lazy OpenAI SDK client pointed at DeepSeek."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY is not set. Export it or put it in .env"
        )

    base_url = os.getenv("DEEPSEEK_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    # Official examples use https://api.deepseek.com (SDK appends /chat/completions)
    return OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=DEFAULT_TIMEOUT,
        max_retries=DEFAULT_MAX_RETRIES,
    )


def chat_complete(
    messages: list[dict],
    *,
    model: Optional[str] = None,
    thinking: bool = True,
    reasoning_effort: ReasoningEffort = "high",
    max_tokens: Optional[int] = None,
    json_mode: bool = False,
    temperature: Optional[float] = None,
    stream: bool = False,
) -> DeepSeekResult:
    """
    Call DeepSeek chat/completions via the OpenAI-compatible client.

    thinking=True  → reasoning_content available (V4 thinking mode)
    thinking=False → faster non-thinking responses
    json_mode=True → response_format json_object (prompt must mention JSON)
    """
    if stream:
        raise ValueError("Streaming is not implemented in chat_complete; use stream=False")

    resolved_model = model or (DEFAULT_REASONING_MODEL if thinking else DEFAULT_MODEL)

    kwargs: dict[str, Any] = {
        "model": resolved_model,
        "messages": messages,
        "stream": False,
    }

    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    if temperature is not None:
        kwargs["temperature"] = temperature

    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    # V4 thinking toggle (must go through extra_body with OpenAI Python SDK)
    thinking_body: dict[str, Any] = {
        "thinking": {"type": "enabled" if thinking else "disabled"},
    }
    if thinking:
        # Official samples pass reasoning_effort at top level + thinking in extra_body
        kwargs["reasoning_effort"] = reasoning_effort

    kwargs["extra_body"] = thinking_body

    client = get_client()
    try:
        response = client.chat.completions.create(**kwargs)
    except TypeError:
        # Older openai SDKs may not accept reasoning_effort as a keyword
        kwargs.pop("reasoning_effort", None)
        if thinking:
            kwargs["extra_body"] = {
                "thinking": {"type": "enabled"},
                "reasoning_effort": reasoning_effort,
            }
        response = client.chat.completions.create(**kwargs)

    choice = response.choices[0]
    message = choice.message
    content = message.content
    reasoning = getattr(message, "reasoning_content", None)

    usage = None
    if getattr(response, "usage", None) is not None:
        usage = {
            "prompt_tokens": getattr(response.usage, "prompt_tokens", None),
            "completion_tokens": getattr(response.usage, "completion_tokens", None),
            "total_tokens": getattr(response.usage, "total_tokens", None),
        }

    return DeepSeekResult(
        content=content,
        reasoning=reasoning,
        model=resolved_model,
        finish_reason=getattr(choice, "finish_reason", None),
        usage=usage,
        raw_message=message,
    )


def parse_json_content(content: str) -> Any:
    """Extract JSON from model content (raw or markdown fenced)."""
    import json

    if not content:
        raise ValueError("Empty content")

    text = content.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif text.startswith("```"):
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    return json.loads(text)
