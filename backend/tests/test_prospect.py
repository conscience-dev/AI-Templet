import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_prospect(authenticated_client: AsyncClient):
    response = await authenticated_client.post("/v1/prospects/", json={
        "name": "홍길동",
        "phone": "010-1234-5678",
        "email": "hong@example.com",
        "inquiry_path": "인터넷검색",
        "hope_region": "서울 강남",
        "startup_budget": 5000,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "홍길동"
    assert data["phone"] == "010-1234-5678"
    assert data["inquiry_path"] == "인터넷검색"
    assert data["status"] == "신규"


@pytest.mark.asyncio
async def test_create_prospect_duplicate_phone(authenticated_client: AsyncClient):
    await authenticated_client.post("/v1/prospects/", json={
        "name": "홍길동",
        "phone": "010-1111-1111",
        "inquiry_path": "매장방문",
    })
    response = await authenticated_client.post("/v1/prospects/", json={
        "name": "김철수",
        "phone": "010-1111-1111",
        "inquiry_path": "소개추천",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_prospects(authenticated_client: AsyncClient):
    await authenticated_client.post("/v1/prospects/", json={
        "name": "문의자A",
        "phone": "010-0001-0001",
        "inquiry_path": "매장방문",
    })
    await authenticated_client.post("/v1/prospects/", json={
        "name": "문의자B",
        "phone": "010-0002-0002",
        "inquiry_path": "매체광고",
    })

    response = await authenticated_client.get("/v1/prospects/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_list_prospects_search(authenticated_client: AsyncClient):
    await authenticated_client.post("/v1/prospects/", json={
        "name": "검색대상",
        "phone": "010-9999-0001",
        "inquiry_path": "기타",
    })
    await authenticated_client.post("/v1/prospects/", json={
        "name": "다른사람",
        "phone": "010-9999-0002",
        "inquiry_path": "기타",
    })

    response = await authenticated_client.get("/v1/prospects/?search=검색")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 1


@pytest.mark.asyncio
async def test_get_prospect(authenticated_client: AsyncClient):
    create_resp = await authenticated_client.post("/v1/prospects/", json={
        "name": "상세조회대상",
        "phone": "010-3333-3333",
        "inquiry_path": "소개추천",
    })
    prospect_id = create_resp.json()["id"]

    response = await authenticated_client.get(f"/v1/prospects/{prospect_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "상세조회대상"


@pytest.mark.asyncio
async def test_get_prospect_not_found(authenticated_client: AsyncClient):
    response = await authenticated_client.get("/v1/prospects/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_prospect(authenticated_client: AsyncClient):
    create_resp = await authenticated_client.post("/v1/prospects/", json={
        "name": "수정전",
        "phone": "010-4444-4444",
        "inquiry_path": "매장방문",
    })
    prospect_id = create_resp.json()["id"]

    response = await authenticated_client.patch(f"/v1/prospects/{prospect_id}", json={
        "name": "수정후",
        "status": "상담중",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "수정후"
    assert response.json()["status"] == "상담중"



@pytest.mark.asyncio
async def test_prospect_unauthenticated(client: AsyncClient):
    response = await client.post("/v1/prospects/", json={
        "name": "테스트",
        "phone": "010-6666-6666",
        "inquiry_path": "기타",
    })
    assert response.status_code == 401


