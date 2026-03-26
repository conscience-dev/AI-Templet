import pytest
from httpx import AsyncClient


async def _create_store(client: AsyncClient, name: str = "테스트점포") -> str:
    resp = await client.post("/v1/stores/", json={
        "store_name": name,
        "region": "서울",
    })
    return resp.json()["id"]


async def _create_inspection(client: AsyncClient, store_id: str, **overrides) -> dict:
    payload = {
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "양호",
        "hygiene_status": "양호",
        **overrides,
    }
    resp = await client.post(f"/v1/stores/{store_id}/inspections", json=payload)
    return resp.json()


@pytest.mark.asyncio
async def test_create_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    response = await supervisor_client.post(f"/v1/stores/{store_id}/inspections", json={
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "양호",
        "quality_notes": "면 물붓기 정상, 염도 적정",
        "hygiene_status": "양호",
        "hygiene_notes": "청결 상태 양호",
        "sales_note": "월 매출 3,500만원",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["quality_status"] == "양호"
    assert data["hygiene_status"] == "양호"
    assert data["sales_note"] == "월 매출 3,500만원"
    assert data["store_name"] == "테스트점포"


@pytest.mark.asyncio
async def test_list_inspections(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await _create_inspection(supervisor_client, store_id,
        inspection_date="2026-03-18T10:00:00",
        quality_status="양호",
        hygiene_status="양호",
    )
    await _create_inspection(supervisor_client, store_id,
        inspection_date="2026-03-20T10:00:00",
        quality_status="미흡",
        hygiene_status="미흡",
    )

    response = await supervisor_client.get(f"/v1/stores/{store_id}/inspections")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)
    created = await _create_inspection(supervisor_client, store_id)
    inspection_id = created["id"]

    response = await supervisor_client.get(f"/v1/inspections/{inspection_id}")
    assert response.status_code == 200
    assert response.json()["quality_status"] == "양호"


@pytest.mark.asyncio
async def test_update_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)
    created = await _create_inspection(supervisor_client, store_id)
    inspection_id = created["id"]

    response = await supervisor_client.patch(f"/v1/stores/{store_id}/inspections/{inspection_id}", json={
        "quality_status": "미흡",
        "quality_notes": "면 물붓기 시간 미준수",
    })
    assert response.status_code == 200
    assert response.json()["quality_status"] == "미흡"
    assert response.json()["quality_notes"] == "면 물붓기 시간 미준수"


@pytest.mark.asyncio
async def test_delete_inspection(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)
    created = await _create_inspection(supervisor_client, store_id)
    inspection_id = created["id"]

    response = await supervisor_client.delete(f"/v1/stores/{store_id}/inspections/{inspection_id}")
    assert response.status_code == 200

    # 삭제 확인
    response = await supervisor_client.get(f"/v1/inspections/{inspection_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_store_inspections_endpoint(supervisor_client: AsyncClient):
    store_id = await _create_store(supervisor_client)

    await _create_inspection(supervisor_client, store_id)

    response = await supervisor_client.get(f"/v1/stores/{store_id}/inspections")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_inspection_permission_denied(authenticated_client: AsyncClient):
    """점포개발 담당자는 점검 기록 생성 불가."""
    response = await authenticated_client.post("/v1/stores/some-id/inspections", json={
        "inspection_date": "2026-03-20T10:00:00",
        "quality_status": "양호",
        "hygiene_status": "양호",
    })
    assert response.status_code == 403
