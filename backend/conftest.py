import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

# Override settings BEFORE importing app
from app.config import settings
settings.ENV_NAME = "local"
settings.SECRET_KEY = "test-secret-key"
settings.ANTHROPIC_API_KEY = "test-anthropic-api-key"
settings.QDRANT_URL = "http://localhost:6333"
settings.EMBEDDING_API_KEY = "test-embedding-api-key"

from app.models.base import Base
from app.models import *  # noqa: F401,F403 — 모든 모델을 로드하여 테이블 생성 보장
from app.models.user import User, UserRole, DepartmentType
from app.database import get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authenticated_client(client: AsyncClient, db_session: AsyncSession):
    """Create a user, set as active staff, and return an authenticated client."""
    # Signup
    await client.post("/v1/auth/signup", json={
        "email": "testuser@example.com",
        "password": "testpass123",
        "name": "테스트유저",
        "role": "manager",
        "department": "dev",
    })

    # Ensure user is active
    result = await db_session.execute(select(User).where(User.email == "testuser@example.com"))
    user = result.scalar_one()
    user.is_active = True
    user.role = UserRole.MANAGER
    user.department = DepartmentType.DEV
    await db_session.commit()

    # Login
    response = await client.post("/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "testpass123",
    })

    data = response.json()
    access_token = data.get("access_token")

    client.headers["Authorization"] = f"Bearer {access_token}"
    return client


@pytest_asyncio.fixture
async def supervisor_client(db_session: AsyncSession):
    """Create a supervisor user and return an authenticated client."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as sv_client:
        await sv_client.post("/v1/auth/signup", json={
            "email": "supervisor@example.com",
            "password": "svpass123",
            "name": "슈퍼바이저",
            "role": "staff",
            "department": "supervisor",
        })

        result = await db_session.execute(select(User).where(User.email == "supervisor@example.com"))
        user = result.scalar_one()
        user.is_active = True
        user.role = UserRole.STAFF
        user.department = DepartmentType.SUPERVISOR
        await db_session.commit()

        response = await sv_client.post("/v1/auth/login", json={
            "email": "supervisor@example.com",
            "password": "svpass123",
        })

        data = response.json()
        access_token = data.get("access_token")
        sv_client.headers["Authorization"] = f"Bearer {access_token}"
        yield sv_client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_client(client: AsyncClient, db_session: AsyncSession):
    """Create an admin user and return an authenticated client."""
    await client.post("/v1/auth/signup", json={
        "email": "admin@example.com",
        "password": "adminpass123",
        "name": "관리자",
        "role": "admin",
    })

    # Set as admin
    result = await db_session.execute(select(User).where(User.email == "admin@example.com"))
    user = result.scalar_one()
    user.role = UserRole.ADMIN
    user.is_active = True
    await db_session.commit()

    response = await client.post("/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123",
    })

    data = response.json()
    access_token = data.get("access_token")

    client.headers["Authorization"] = f"Bearer {access_token}"
    return client
