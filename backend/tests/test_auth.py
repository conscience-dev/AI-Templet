import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """헬스체크 엔드포인트가 동작한다."""
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_signup(client: AsyncClient):
    """회원가입이 정상 동작한다."""
    response = await client.post("/v1/auth/signup", json={
        "email": "newuser@example.com",
        "password": "password123",
        "name": "신규유저",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "신규유저"


@pytest.mark.asyncio
async def test_signup_duplicate(client: AsyncClient):
    """중복 이메일로 회원가입 시 에러가 발생한다."""
    payload = {
        "email": "dupuser@example.com",
        "password": "password123",
        "name": "중복유저",
    }
    await client.post("/v1/auth/signup", json=payload)
    response = await client.post("/v1/auth/signup", json=payload)
    assert response.status_code in (400, 409, 420, 422)


@pytest.mark.asyncio
async def test_login(authenticated_client: AsyncClient):
    """인증된 사용자가 내 정보를 조회할 수 있다."""
    response = await authenticated_client.get("/v1/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """잘못된 비밀번호로 로그인 시 실패한다."""
    await client.post("/v1/auth/signup", json={
        "email": "wrongpw@example.com",
        "password": "password123",
        "name": "비번틀린유저",
    })
    response = await client.post("/v1/auth/login", json={
        "email": "wrongpw@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code in (400, 401)


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    """비인증 사용자는 내 정보를 조회할 수 없다."""
    response = await client.get("/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_access(admin_client: AsyncClient):
    """관리자가 사용자 목록을 조회할 수 있다."""
    response = await admin_client.get("/v1/auth/users")
    assert response.status_code == 200
