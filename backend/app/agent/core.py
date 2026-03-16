from deepagents import create_deep_agent
from langchain_anthropic import ChatAnthropic
from langgraph.checkpoint.memory import MemorySaver
from app.config import settings


def get_model():
    """Settings 기반 ChatAnthropic 인스턴스 생성."""
    return ChatAnthropic(
        model=settings.AGENT_MODEL,
        api_key=settings.ANTHROPIC_API_KEY,
        temperature=settings.AGENT_TEMPERATURE,
        max_tokens=settings.AGENT_MAX_TOKENS,
    )


def create_agent(tools=None, subagents=None):
    """
    Deep Agent 생성.

    SPEC.md 기반 프로젝트 생성 시 agent.md가
    서브에이전트와 커스텀 도구를 추가합니다.
    """
    model = get_model()
    agent = create_deep_agent(
        model=model,
        tools=tools or [],
        subagents=subagents or None,
        system_prompt=settings.AGENT_SYSTEM_PROMPT,
        checkpointer=MemorySaver(),  # thread_id 기반 대화 유지에 필수
    )
    return agent
