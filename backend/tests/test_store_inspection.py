import pytest
from httpx import AsyncClient


async def _create_store(client: AsyncClient, name: str = "테스트점포") -> str:
    resp = await client.post("/v1/stores/", json={
        "store_name": name,
        "region": "서울",
    })
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    response = await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "quality_notes": "면 물붓기 정상, 염도 적정",
        "hygiene_status": "양호",
        "hygiene_notes": "청결 상태 양호",
        "sales_amount": 3500,
        "sales_mom_change": 5.2,
        "staff_count": {"홀": 2, "주방": 3},
    })
    assert response.status_code == 200
    data = response.json()
    assert data["quality_status"] == "준수"
    assert data["hygiene_status"] == "양호"
    assert data["sales_amount"] == 3500
    assert data["store_name"] == "테스트점포"


@pytest.mark.asyncio
async def test_list_inspections(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-18T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })
    await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "미흡",
        "hygiene_status": "미흡",
    })

    response = await supervisor_client.get("/v1/inspections/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_get_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })
    inspection_id = create_resp.json()["id"]

    response = await supervisor_client.get(f"/v1/inspections/{inspection_id}")
    assert response.status_code == 200
    assert response.json()["quality_status"] == "준수"


@pytest.mark.asyncio
async def test_update_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })
    inspection_id = create_resp.json()["id"]

    response = await supervisor_client.patch(f"/v1/inspections/{inspection_id}", json={
        "quality_status": "미흡",
        "quality_notes": "면 물붓기 시간 미준수",
    })
    assert response.status_code == 200
    assert response.json()["quality_status"] == "미흡"
    assert response.json()["quality_notes"] == "면 물붓기 시간 미준수"


@pytest.mark.asyncio
async def test_delete_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    create_resp = await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })
    inspection_id = create_resp.json()["id"]

    response = await supervisor_client.delete(f"/v1/inspections/{inspection_id}")
    assert response.status_code == 200

    response = await supervisor_client.get(f"/v1/inspections/{inspection_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_store_inspections_endpoint(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await supervisor_client.post("/v1/inspections/", json={
        "store_id": store_id,
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })

    response = await supervisor_client.get(f"/v1/stores/{store_id}/inspections")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_inspection_permission_denied(authenticated_client: AsyncClient):
    """점포개발 담당자는 점검 기록 생성 불가."""
    response = await authenticated_client.post("/v1/inspections/", json={
        "store_id": "some-id",
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "준수",
        "hygiene_status": "양호",
    })
    assert response.status_code == 403
