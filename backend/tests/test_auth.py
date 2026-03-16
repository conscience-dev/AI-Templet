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
        "username": "newuser",
        "password": "password123",
        "password_confirm": "password123",
        "terms_of_service": True,
        "privacy_policy_agreement": True,
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_signup_duplicate(client: AsyncClient):
    """중복 아이디로 회원가입 시 에러가 발생한다."""
    payload = {
        "username": "dupuser",
        "password": "password123",
        "password_confirm": "password123",
        "terms_of_service": True,
        "privacy_policy_agreement": True,
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
    assert data["username"] == "testuser"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """잘못된 비밀번호로 로그인 시 실패한다."""
    await client.post("/v1/auth/signup", json={
        "username": "wrongpw",
        "password": "password123",
        "password_confirm": "password123",
        "terms_of_service": True,
        "privacy_policy_agreement": True,
    })
    response = await client.post("/v1/auth/login", json={
        "username": "wrongpw",
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
