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
from app.models.user import User, UserStatus, UserRole
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
        await conn.run_sync(Base.metadata.drop_all)


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
    """Create a user, approve them (consultant status), and return an authenticated client."""
    # Signup
    await client.post("/v1/auth/signup", json={
        "username": "testuser",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "terms_of_service": True,
        "privacy_policy_agreement": True,
    })

    # Manually approve user and set role
    result = await db_session.execute(select(User).where(User.username == "testuser"))
    user = result.scalar_one()
    user.status = UserStatus.ACTIVE
    user.role = UserRole.DEV_MANAGER
    user.name = "테스트유저"
    await db_session.commit()

    # Login
    response = await client.post("/v1/auth/login", json={
        "username": "testuser",
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
            "username": "supervisoruser",
            "password": "svpass123",
            "password_confirm": "svpass123",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        })

        result = await db_session.execute(select(User).where(User.username == "supervisoruser"))
        user = result.scalar_one()
        user.status = UserStatus.ACTIVE
        user.role = UserRole.SUPERVISOR
        user.name = "슈퍼바이저"
        await db_session.commit()

        response = await sv_client.post("/v1/auth/login", json={
            "username": "supervisoruser",
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
        "username": "adminuser",
        "password": "adminpass123",
        "password_confirm": "adminpass123",
        "terms_of_service": True,
        "privacy_policy_agreement": True,
    })

    # Set as admin
    result = await db_session.execute(select(User).where(User.username == "adminuser"))
    user = result.scalar_one()
    user.status = UserStatus.ADMIN
    user.role = UserRole.ADMIN
    user.name = "관리자"
    await db_session.commit()

    response = await client.post("/v1/auth/login", json={
        "username": "adminuser",
        "password": "adminpass123",
    })

    data = response.json()
    access_token = data.get("access_token")

    client.headers["Authorization"] = f"Bearer {access_token}"
    return client
