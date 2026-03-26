"""Claude API 연동 유틸리티."""
import json
import logging

import anthropic
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client(token: str | None = None) -> anthropic.Anthropic:
    """Anthropic 클라이언트를 생성합니다.

    우선순위:
    1. 명시적으로 전달된 token (DB에서 조회한 OAuth 토큰)
    2. 환경변수 ANTHROPIC_API_KEY
    3. 둘 다 없으면 503 에러
    """
    token = token or settings.ANTHROPIC_API_KEY
    if not token:
        raise HTTPException(
            status_code=503,
            detail="AI 기능을 사용할 수 없습니다. API 키 또는 OAuth 토큰이 설정되지 않았습니다.",
        )
    # OAuth 토큰(sk-ant-oat*)은 auth_token + beta 헤더로 전달
    if token.startswith("sk-ant-oat"):
        return anthropic.Anthropic(
            auth_token=token,
            default_headers={"anthropic-beta": "oauth-2025-04-20"},
        )
    return anthropic.Anthropic(api_key=token)


def call_claude(system_prompt: str, user_prompt: str, token: str | None = None) -> str:
    """Claude API를 호출하여 텍스트 응답을 반환합니다."""
    client = _get_client(token)

    try:
        message = client.messages.create(
            model=settings.AGENT_MODEL,
            max_tokens=settings.AGENT_MAX_TOKENS,
            temperature=settings.AGENT_TEMPERATURE,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return message.content[0].text
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=503,
            detail="AI API 인증에 실패했습니다. API 키를 확인해주세요.",
        )
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=503,
            detail="AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        )
    except anthropic.APIError as e:
        logger.error(f"Claude API 에러: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        )


def call_claude_json(system_prompt: str, user_prompt: str, token: str | None = None) -> dict | list:
    """Claude API를 호출하여 JSON 응답을 파싱합니다."""
    response_text = call_claude(system_prompt, user_prompt, token=token)

    # JSON 블록 추출 (```json ... ``` 형식 또는 순수 JSON)
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"Claude JSON 파싱 실패, 원본 텍스트 반환: {response_text[:200]}")
        raise HTTPException(
            status_code=502,
            detail="AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        )
