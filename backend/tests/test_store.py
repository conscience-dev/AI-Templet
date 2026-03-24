import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_store(supervisor_client: AsyncClient):
    response = await supervisor_client.post("/v1/stores/", json={
        "store_name": "부산해운대센텀점",
        "region": "부산",
        "address": "부산광역시 해운대구 센텀로 100",
        "store_size": 30,
        "status": "운영중",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["store_name"] == "부산해운대센텀점"
    assert data["region"] == "부산"
    assert data["status"] == "운영중"


@pytest.mark.asyncio
async def test_create_store_duplicate_name(supervisor_client: AsyncClient):
    await supervisor_client.post("/v1/stores/", json={
        "store_name": "중복점포",
        "region": "서울",
    })
    response = await supervisor_client.post("/v1/stores/", json={
        "store_name": "중복점포",
        "region": "부산",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_stores(supervisor_client: AsyncClient):
    await supervisor_client.post("/v1/stores/", json={
        "store_name": "서울강남점",
        "region": "서울",
    })
    await supervisor_client.post("/v1/stores/", json={
        "store_name": "부산서면점",
        "region": "부산",
    })

    response = await supervisor_client.get("/v1/stores/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_list_stores_filter_region(supervisor_client: AsyncClient):
    await supervisor_client.post("/v1/stores/", json={
        "store_name": "서울역삼점",
        "region": "서울",
    })
    await supervisor_client.post("/v1/stores/", json={
        "store_name": "대전둔산점",
        "region": "대전",
    })

    response = await supervisor_client.get("/v1/stores/?region=서울")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 1


@pytest.mark.asyncio
async def test_get_store(supervisor_client: AsyncClient):
    create_resp = await supervisor_client.post("/v1/stores/", json={
        "store_name": "상세조회점",
        "region": "인천",
    })
    store_id = create_resp.json()["id"]

    response = await supervisor_client.get(f"/v1/stores/{store_id}")
    assert response.status_code == 200
    assert response.json()["store_name"] == "상세조회점"


@pytest.mark.asyncio
async def test_get_store_not_found(supervisor_client: AsyncClient):
    response = await supervisor_client.get("/v1/stores/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_store(supervisor_client: AsyncClient):
    create_resp = await supervisor_client.post("/v1/stores/", json={
        "store_name": "수정전점포",
        "region": "서울",
    })
    store_id = create_resp.json()["id"]

    response = await supervisor_client.patch(f"/v1/stores/{store_id}", json={
        "store_name": "수정후점포",
        "region": "경기",
    })
    assert response.status_code == 200
    assert response.json()["store_name"] == "수정후점포"
    assert response.json()["region"] == "경기"


@pytest.mark.asyncio
async def test_delete_store(supervisor_client: AsyncClient):
    create_resp = await supervisor_client.post("/v1/stores/", json={
        "store_name": "삭제대상점",
        "region": "제주",
    })
    store_id = create_resp.json()["id"]

    response = await supervisor_client.delete(f"/v1/stores/{store_id}")
    assert response.status_code == 200

    response = await supervisor_client.get(f"/v1/stores/{store_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_store_unauthenticated(client: AsyncClient):
    response = await client.post("/v1/stores/", json={
        "store_name": "테스트점",
        "region": "서울",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_store_permission_denied(authenticated_client: AsyncClient):
    """점포개발 담당자(dev_manager)는 점포 생성 불가."""
    response = await authenticated_client.post("/v1/stores/", json={
        "store_name": "권한없음점",
        "region": "서울",
    })
    assert response.status_code == 403
