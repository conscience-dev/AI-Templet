from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

_vector_store = None


def get_vector_store():
    """Qdrant 벡터스토어 싱글톤 인스턴스 반환."""
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
    """문서를 청킹하여 Qdrant에 인덱싱합니다."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents(documents, metadatas=metadatas)
    store = get_vector_store()
    await store.aadd_documents(chunks)
