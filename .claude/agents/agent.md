---
name: agent
description: Deep Agents 기반 멀티에이전트 + RAG 시스템 전문 에이전트. SPEC.md 섹션 9를 동적으로 파싱하여 LangGraph 에이전트, 서브에이전트, RAG 파이프라인, DB 연동 도구, 파일 임베딩 API를 생성.
---

# Deep Agents 멀티에이전트 + RAG 시스템 에이전트

## 역할

SPEC.md **섹션 9 (에이전트 설정)**을 **동적으로 파싱**하고, 그 내용에 맞는 코드를 생성하는 전문 에이전트.

- Phase 5.5에서 실행 (DB 마이그레이션 후, 테스트 생성 전)
- SPEC.md 섹션 9에 정의된 내용만큼만 생성 (없으면 생략)
- 프로젝트별로 다른 서브에이전트, 도구, RAG 소스가 생성됨

## 동작 원리

```
사용자: "SPEC.md를 읽고 프로젝트를 생성해줘"
  ↓
SKILL.md Phase 5.5 → 이 에이전트(agent.md) 호출
  ↓
1. SPEC.md 섹션 9 파싱
2. 섹션 9의 테이블에서 서브에이전트, 도구, RAG 소스 추출
3. 아래 코드 패턴을 따라 backend/app/agent/ 코드를 동적 생성
4. SPEC.md 섹션 3의 모델을 분석 → DB 조회 도구 자동 생성
```

> **중요**: 이 문서의 코드 블록은 **생성 패턴(템플릿)**입니다.
> `{변수명}` 부분을 SPEC.md에서 읽은 값으로 치환하여 실제 코드를 생성합니다.

## 입력: SPEC.md 섹션 9 파싱

### 필수 파싱 항목

| SPEC.md 항목 | 추출할 값 | 매핑 대상 |
|-------------|----------|----------|
| 메인 에이전트 > LLM | 모델명 | `config.py` → `AGENT_MODEL` |
| 메인 에이전트 > Temperature | 숫자 | `config.py` → `AGENT_TEMPERATURE` |
| 메인 에이전트 > Max Tokens | 숫자 | `config.py` → `AGENT_MAX_TOKENS` |
| 시스템 프롬프트 | 텍스트 전체 | `config.py` → `AGENT_SYSTEM_PROMPT` |
| 임베딩 모델 | 모델명 | `config.py` → `EMBEDDING_MODEL` |
| 벡터 DB | URL | `config.py` → `QDRANT_URL` |

### 조건부 파싱 항목

| SPEC.md 항목 | 있으면 | 없으면 |
|-------------|-------|-------|
| **서브에이전트 테이블** | `SubAgent` 정의 + `chat.py`에 등록 | 서브에이전트 없이 단일 에이전트 |
| **커스텀 도구 테이블** | `tools/` 아래 도구 파일 생성 | `search_knowledge`만 기본 생성 |
| **RAG 소스 테이블** | `embedding.py` 라우터 + 모델 생성 | 임베딩 API 생략 |

### SPEC.md 섹션 9 예시 형식

```markdown
## 9. 에이전트 설정

### 메인 에이전트

| 항목 | 값 |
|------|---|
| 에이전트 이름 | {에이전트 이름} |
| 프레임워크 | Deep Agents (`deepagents` v0.4+) |
| LLM | Anthropic Claude (`{모델명}`) |
| Temperature | {0.0~1.0} |
| Max Tokens | {숫자} |
| 임베딩 모델 | {모델명} |
| 벡터 DB | Qdrant |

### 서브에이전트 (선택)

| 이름 | 설명 | 도구 |
|------|------|------|
| {이름} | {설명} | {도구1}, {도구2} |

### 커스텀 도구 (선택)

| 도구 | 설명 |
|------|------|
| search_knowledge | Qdrant 벡터 DB에서 관련 문서를 유사도 검색 |
| {도구명} | {설명} — DB 모델 조회 시 SPEC 섹션 3 참조 |

### RAG 소스 (선택)

| 소스 | 타입 | 설명 |
|------|------|------|
| {소스명} | file | {설명} |
```

## 생성할 디렉토리 구조

```
backend/app/
├── agent/
│   ├── __init__.py              # 항상 생성
│   ├── core.py                  # 항상 생성 — create_agent + get_model
│   ├── rag.py                   # 항상 생성 — 벡터스토어 + 임베딩
│   ├── streaming.py             # 항상 생성 — SSE 스트리밍 변환
│   └── tools/
│       ├── __init__.py          # 항상 생성
│       ├── rag_tool.py          # 항상 생성 — search_knowledge
│       └── db_tools.py          # 조건부 — 커스텀 도구에 DB 조회가 있을 때
├── routers/
│   ├── chat.py                  # 수정 — agent_message 연동
│   └── embedding.py             # 조건부 — RAG 소스가 있을 때
├── schemas/
│   └── embedding.py             # 조건부 — RAG 소스가 있을 때
├── models/
│   └── embedding.py             # 조건부 — RAG 소스가 있을 때
└── config.py                    # 수정 — 환경변수 추가
```

## 핵심 기술 스택

| 패키지 | 버전 | 설치 조건 |
|--------|------|----------|
| `deepagents` | >=0.4.0 | 항상 |
| `langchain-anthropic` | >=0.3.0 | 항상 |
| `langchain-openai` | >=0.3.0 | 항상 (임베딩) |
| `langchain-qdrant` | >=0.2.0 | 항상 |
| `langchain-text-splitters` | >=0.3.0 | 항상 |
| `qdrant-client` | >=1.12.0 | 항상 |
| `pymupdf` | >=1.24.0 | RAG 소스가 있을 때 |
| `python-docx` | >=1.1.0 | RAG 소스가 있을 때 |

---

## Step 1: 환경변수 추가 (항상)

`backend/app/config.py`에 SPEC.md 섹션 9 값으로 추가:

```python
class Settings(BaseSettings):
    # ... 기존 설정

    # Deep Agent
    ANTHROPIC_API_KEY: str = ""
    AGENT_MODEL: str = "{SPEC 섹션 9 > LLM 모델명}"
    AGENT_TEMPERATURE: float = {SPEC 섹션 9 > Temperature}
    AGENT_MAX_TOKENS: int = {SPEC 섹션 9 > Max Tokens}
    AGENT_SYSTEM_PROMPT: str = "{SPEC 섹션 9 > 시스템 프롬프트 전체}"

    # Qdrant (RAG)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "{SPEC 섹션 1 > slug}_knowledge"

    # 임베딩
    EMBEDDING_MODEL: str = "{SPEC 섹션 9 > 임베딩 모델}"
    EMBEDDING_API_KEY: str = ""
```

## Step 2: 에이전트 패키지 생성 (항상)

### `core.py` — 항상 동일

```python
from deepagents import create_deep_agent, SubAgent
from langchain_anthropic import ChatAnthropic
from langgraph.checkpoint.memory import MemorySaver
from app.config import settings

def get_model():
    return ChatAnthropic(
        model=settings.AGENT_MODEL,
        api_key=settings.ANTHROPIC_API_KEY,
        temperature=settings.AGENT_TEMPERATURE,
        max_tokens=settings.AGENT_MAX_TOKENS,
    )

def create_agent(tools=None, subagents=None):
    model = get_model()
    agent = create_deep_agent(
        model=model,
        tools=tools or [],
        subagents=subagents or None,
        system_prompt=settings.AGENT_SYSTEM_PROMPT,
        checkpointer=MemorySaver(),  # thread_id 기반 대화 유지에 필수
    )
    return agent
```

### `rag.py` — 항상 동일

```python
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

_vector_store = None

def get_vector_store():
    global _vector_store
    if _vector_store is None:
        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.EMBEDDING_API_KEY,
        )
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
        )
        _vector_store = QdrantVectorStore(
            client=client,
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding=embeddings,
        )
    return _vector_store

async def ingest_documents(documents: list[str], metadatas: list[dict] = None):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents(documents, metadatas=metadatas)
    store = get_vector_store()
    await store.aadd_documents(chunks)
```

### `streaming.py` — 항상 동일

> **주의**: `astream_events(version="v2")`는 Deep Agents에서 행이 걸림. 반드시 `astream(stream_mode="messages")`를 사용.
> Anthropic 모델은 content를 `[{"type": "text", "text": "..."}]` 리스트로 반환할 수 있으므로 리스트 처리 필수.

```python
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

async def stream_agent_response(agent, user_message: str, thread_id: str) -> AsyncGenerator[str, None]:
    """
    LangGraph 에이전트 스트리밍을 텍스트 청크로 변환합니다.
    agent.astream(stream_mode='messages')로 실시간 토큰을 yield합니다.
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
```

### `tools/rag_tool.py` — 항상 동일

```python
from app.agent.rag import get_vector_store

def search_knowledge(query: str, top_k: int = 5) -> str:
    """지식 베이스에서 관련 문서를 검색합니다."""
    store = get_vector_store()
    docs = store.similarity_search(query, k=top_k)
    if not docs:
        return "관련 문서를 찾을 수 없습니다."
    results = []
    for i, doc in enumerate(docs, 1):
        results.append(f"[{i}] {doc.page_content}")
    return "\n\n---\n\n".join(results)
```

## Step 3: DB 연동 도구 생성 (조건부)

> SPEC.md 섹션 9의 **커스텀 도구 테이블**에 DB 조회 도구가 정의된 경우에만 생성.
> 도구가 참조하는 모델은 **SPEC.md 섹션 3**에서 확인.

### 판단 기준

커스텀 도구 테이블에서 `get_`, `list_`, `search_` 등 DB 조회 패턴이 있는 도구를 찾는다:

| 도구명 패턴 | 참조할 SPEC 섹션 | 생성 코드 |
|------------|----------------|----------|
| `get_{model}_info` | 섹션 3의 `{Model}` 모델 | 해당 모델 전체 필드 조회 |
| `list_{model}_{related}s` | 섹션 3의 FK 관계 | FK 기반 목록 조회 |

### `tools/db_tools.py` 생성 패턴

```python
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.{model_file} import {Model}
# FK 관계가 있으면 관련 모델도 import


async def get_{model}_info({model}_id: str) -> str:
    """SPEC 섹션 3의 {Model} 모델 정보를 조회합니다."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select({Model}).where({Model}.id == {model}_id))
        item = result.scalar_one_or_none()
        if not item:
            return f"ID '{{{model}_id}}'를 찾을 수 없습니다."
        # SPEC 섹션 3의 필드명으로 동적 생성
        return (
            f"필드1: {item.field1}\n"
            f"필드2: {item.field2}\n"
            # ... SPEC 섹션 3의 모든 주요 필드
        )


async def list_{model}_{related}s({model}_id: str) -> str:
    """SPEC 섹션 3의 FK 관계를 따라 관련 목록을 조회합니다."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select({Related})
            .where({Related}.{model}_id == {model}_id)
            .order_by({Related}.created_at.desc())
            .limit(10)
        )
        items = result.scalars().all()
        if not items:
            return f"관련 항목이 없습니다."
        lines = [f"- {item.title} ({item.created_at.strftime('%Y-%m-%d')})" for item in items]
        return f"{len(items)}건:\n" + "\n".join(lines)
```

## Step 4: 서브에이전트 정의 (조건부)

> SPEC.md 섹션 9의 **서브에이전트 테이블**이 있을 때만 생성.

### `chat.py`의 `get_agent()` 생성 패턴

```python
from deepagents import SubAgent
from app.agent.core import create_agent
from app.agent.tools.rag_tool import search_knowledge
# 커스텀 도구가 있으면 import 추가
# from app.agent.tools.db_tools import get_{model}_info, list_{model}_{related}s

_agent = None

def get_agent():
    global _agent
    if _agent is None:
        tools = [search_knowledge]  # + DB 도구들

        # SPEC.md 섹션 9 서브에이전트 테이블에서 동적 생성
        # ⚠️ SubAgent의 system_prompt는 필수 필드 — 누락 시 KeyError 발생
        subagents = [
            SubAgent(
                name="{SPEC 서브에이전트 이름}",
                description="{SPEC 서브에이전트 설명}",
                system_prompt="{역할에 맞는 시스템 프롬프트 — 한국어, 반드시 포함}",
                tools=[{SPEC 서브에이전트 도구 목록에서 매핑}],
            ),
            # ... 섹션 9에 정의된 만큼 반복
        ]

        _agent = create_agent(tools=tools, subagents=subagents)
    return _agent
```

**서브에이전트가 없으면** (단일 에이전트):

```python
def get_agent():
    global _agent
    if _agent is None:
        _agent = create_agent(tools=[search_knowledge])
    return _agent
```

## Step 5: 파일 임베딩 API (조건부)

> SPEC.md 섹션 9의 **RAG 소스 테이블**이 있을 때만 생성.

### 생성할 파일 3개

1. **`models/embedding.py`** — `EmbeddedDocument` 모델

```python
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel, GUID

class EmbeddedDocument(BaseModel):
    __tablename__ = "embedded_documents"
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    uploaded_by = mapped_column(GUID(), ForeignKey("{user_tablename}.id", ondelete="CASCADE"), nullable=False)
```

2. **`schemas/embedding.py`**

```python
from pydantic import BaseModel

class EmbeddedDocumentOut(BaseModel):
    id: str
    filename: str
    category: str
    chunk_count: int
    file_size: int
    created_at: str
```

3. **`routers/embedding.py`** — 업로드/목록/삭제 3개 엔드포인트

```python
# POST /v1/embeddings/upload — 파일 업로드 → 텍스트 추출 → Qdrant 임베딩
# GET  /v1/embeddings/       — 임베딩된 문서 목록 조회
# DELETE /v1/embeddings/{id} — 문서 삭제

# 지원 형식: PDF (pymupdf), DOCX (python-docx), TXT, MD
# 최대 크기: 10MB
# 청킹: RecursiveCharacterTextSplitter(chunk_size=1000, overlap=200)
# 메타데이터: filename, category (SPEC RAG 소스의 소스명에서 추출), uploaded_by
```

### 추가 작업

- `models/__init__.py`에 `EmbeddedDocument` import 추가
- `main.py`에 `embedding` 라우터 등록 (`prefix="/v1/embeddings"`)
- Alembic 마이그레이션 생성 + 적용
- `docker-compose.yml`에 Qdrant 서비스 추가

### RAG 소스 → category 매핑

SPEC.md RAG 소스 테이블의 소스명을 category 값으로 변환:

| SPEC 소스명 패턴 | category 값 |
|----------------|------------|
| `대학`, `university`, `입학` | `university` |
| `학생`, `student`, `포트폴리오` | `student` |
| `매뉴얼`, `가이드`, `manual` | `manual` |
| 그 외 | `general` |

## Step 6: chat.py 라우터 수정 (항상)

기존 AI 클라이언트 호출을 `stream_agent_response`로 교체:

```python
# 기존: nora_client.stream_chat() 또는 ai_client.stream_chat()
# 변경: stream_agent_response(agent, message, thread_id)

async for chunk in stream_agent_response(
    agent=get_agent(),
    user_message=data.message,
    thread_id=str(thread_id),
):
    accumulated += chunk
    yield f"data: {json.dumps({'event': 'stream', 'data': {'chunk': chunk, 'accumulated': accumulated}}, ensure_ascii=False)}\n\n"
```

SSE 이벤트 규약 (프론트엔드 `use-chat-stream.ts` 호환):
```
data: {"event": "user_message", "data": {"id": "...", "type": "user", "message": "..."}}
data: {"event": "stream", "data": {"chunk": "텍", "accumulated": "텍스트"}}
data: {"event": "done", "data": {"id": "...", "type": "ai_assistant", "message": "전체 응답"}}
data: {"event": "error", "data": {"message": "에러 메시지"}}
```

## 테스트 패턴

### 에이전트 생성 (mock)

```python
@pytest.mark.asyncio
@patch("app.agent.core.ChatAnthropic")
@patch("app.agent.core.create_deep_agent")
async def test_create_agent(mock_create, mock_llm):
    from app.agent.core import create_agent
    mock_create.return_value = MagicMock()
    agent = create_agent()
    assert agent is not None
    mock_create.assert_called_once()
```

### DB 도구 (mock session)

```python
@pytest.mark.asyncio
@patch("app.agent.tools.db_tools.AsyncSessionLocal")
async def test_get_{model}_info(mock_session_factory):
    mock_item = MagicMock()
    mock_item.field1 = "테스트값"
    # ... mock 설정
    result = await get_{model}_info("some-id")
    assert "테스트값" in result
```

### 파일 임베딩 API (mock ingest)

```python
@pytest.mark.asyncio
@patch("app.routers.embedding.ingest_documents")
async def test_upload_and_embed(mock_ingest, authenticated_client):
    mock_ingest.return_value = None
    files = {"file": ("test.txt", b"테스트 내용", "text/plain")}
    resp = await authenticated_client.post("/v1/embeddings/upload", files=files, data={"category": "general"})
    assert resp.status_code == 200
```

## 체크리스트

### 항상 실행

- [ ] SPEC.md 섹션 9 파싱 (메인 에이전트 설정값 추출)
- [ ] `config.py`에 ANTHROPIC, QDRANT, EMBEDDING 환경변수 추가
- [ ] `agent/__init__.py`, `core.py`, `rag.py`, `streaming.py` 생성
- [ ] `agent/tools/rag_tool.py` 생성 (search_knowledge)
- [ ] `routers/chat.py` 수정 (stream_agent_response 연동)
- [ ] `requirements.txt`에 deepagents, langchain-* 의존성 추가
- [ ] `docker-compose.yml`에 Qdrant 서비스 추가

### 조건부 실행

- [ ] 커스텀 도구 테이블이 있으면 → `tools/db_tools.py` 생성 (SPEC 섹션 3 모델 기반)
- [ ] 서브에이전트 테이블이 있으면 → `chat.py`에 SubAgent 정의 추가
- [ ] RAG 소스 테이블이 있으면 → `embedding.py` 라우터/모델/스키마 + Alembic 마이그레이션
- [ ] RAG 소스가 있으면 → `requirements.txt`에 pymupdf, python-docx 추가

---

## 대안 아키텍처: Anthropic SDK 직접 사용

Deep Agents 없이 Anthropic SDK로 직접 에이전트를 구현하는 패턴.
SPEC.md 섹션 9에서 `프레임워크`가 `Anthropic SDK` 또는 `직접 구현`이면 이 패턴 사용.

### Tool Factory 패턴

```python
# backend/app/agent/tool_factory.py
from anthropic import Anthropic


def create_tool_definitions(tools_config: list[dict]) -> list[dict]:
    """SPEC.md 커스텀 도구 테이블에서 Anthropic tool 정의 생성."""
    definitions = []
    for tool in tools_config:
        definitions.append({
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool.get("schema", {"type": "object", "properties": {}}),
        })
    return definitions


TOOL_HANDLERS = {}  # tool_name → async callable 매핑


def register_tool(name: str):
    """도구 등록 데코레이터."""
    def decorator(func):
        TOOL_HANDLERS[name] = func
        return func
    return decorator


async def execute_tool(name: str, input_data: dict) -> str:
    """등록된 도구 실행."""
    handler = TOOL_HANDLERS.get(name)
    if not handler:
        return f"알 수 없는 도구: {name}"
    return await handler(**input_data)
```

### Anthropic SDK 직접 스트리밍

```python
# backend/app/agent/streaming_anthropic.py
from anthropic import AsyncAnthropic
from app.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def stream_anthropic_response(
    messages: list[dict],
    system_prompt: str,
    tools: list[dict] = None,
):
    """Anthropic Messages API 직접 스트리밍."""
    kwargs = {
        "model": settings.AGENT_MODEL,
        "max_tokens": settings.AGENT_MAX_TOKENS,
        "temperature": settings.AGENT_TEMPERATURE,
        "system": system_prompt,
        "messages": messages,
    }
    if tools:
        kwargs["tools"] = tools

    async with client.messages.stream(**kwargs) as stream:
        async for text in stream.text_stream:
            yield text
```

### 선택 기준

| 기준 | Deep Agents | Anthropic SDK 직접 |
|------|-------------|-------------------|
| 서브에이전트 | 내장 지원 | 직접 구현 필요 |
| 대화 기록 | MemorySaver 자동 | DB 저장 직접 구현 |
| 도구 호출 | LangGraph 자동 | tool_use 응답 파싱 직접 |
| 의존성 | deepagents, langchain-* | anthropic만 |
| 커스터마이징 | 제한적 | 완전 제어 |

## ⚠️ 주의사항 (실전 디버깅에서 확인된 필수 사항)

### Deep Agents 스트리밍

| 문제 | 원인 | 해결 |
|------|------|------|
| `astream_events` 행 걸림 | Deep Agents에서 미지원 | `astream(stream_mode="messages")` 사용 |
| thread_id 대화 유지 안됨 | checkpointer 누락 | `create_deep_agent(checkpointer=MemorySaver())` 필수 |
| Anthropic content 빈 문자열 | content가 리스트 `[{"type":"text","text":"..."}]` | streaming.py에서 리스트 분기 처리 |

### SubAgent 정의

| 문제 | 원인 | 해결 |
|------|------|------|
| `KeyError: 'system_prompt'` | SubAgent TypedDict에 `system_prompt` 필수 | 반드시 `system_prompt` 포함 |
| 파라미터명 오류 | `sub_agents` vs `subagents` | `create_deep_agent(subagents=...)` (언더스코어 없음) |

### Alembic 마이그레이션

| 문제 | 원인 | 해결 |
|------|------|------|
| `NameError: name 'app' is not defined` | GUID 타입이 migration 파일에 `app.models.base.GUID()`로 기록 | migration 파일에서 `sa.String(length=36)`으로 수동 변경 |

### Python 호환성

| 문제 | 원인 | 해결 |
|------|------|------|
| `datetime.utcnow()` 경고 | Python 3.12+ deprecated | `datetime.now(timezone.utc)` 사용 |
