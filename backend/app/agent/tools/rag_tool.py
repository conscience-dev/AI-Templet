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
