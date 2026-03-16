import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


async def stream_agent_response(
    agent,
    user_message: str,
    thread_id: str,
) -> AsyncGenerator[str, None]:
    """
    LangGraph 에이전트 스트리밍을 텍스트 청크로 변환합니다.

    astream(stream_mode='messages')로 실시간 토큰을 yield합니다.
    주의: astream_events(version="v2")는 Deep Agents에서 행이 걸리므로 사용 금지.
    """
    config = {"configurable": {"thread_id": thread_id}}
    input_msg = {"messages": [{"role": "user", "content": user_message}]}

    async for chunk in agent.astream(input_msg, config=config, stream_mode="messages"):
        msg, metadata = chunk
        if not hasattr(msg, "content") or not msg.content:
            continue

        content = msg.content
        # content가 리스트인 경우 (Anthropic 모델)
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text"):
                    yield block["text"]
                elif isinstance(block, str) and block:
                    yield block
        elif isinstance(content, str) and content:
            yield content
