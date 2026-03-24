import pytest
from httpx import AsyncClient


async def _create_prospect(client: AsyncClient, phone: str = "010-1234-5678") -> str:
    """헬퍼: 가맹문의자 생성 후 ID 반환."""
    resp = await client.post("/v1/prospects/", json={
        "name": "테스트문의자",
        "phone": phone,
        "inquiry_path": "매장방문",
    })
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    response = await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "1차 상담 진행. 강남 지역 관심, 예산 5천만원.",
        "result": "A가망고객",
        "next_action": "2차 상담 시 매장 방문 안내",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["consultation_order"] == 1
    assert data["result"] == "A가망고객"
    assert data["prospect_name"] == "테스트문의자"


@pytest.mark.asyncio
async def test_list_consultations(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-18T10:00:00",
        "content": "1차 상담",
        "result": "B지속고객",
    })
    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 2,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "2차 상담",
        "result": "A가망고객",
    })

    response = await authenticated_client.get("/v1/consultations/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_list_consultations_filter_by_prospect(authenticated_client: AsyncClient):
    p1 = await _create_prospect(authenticated_client, "010-0001-0001")
    p2 = await _create_prospect(authenticated_client, "010-0002-0002")

    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": p1,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "A문의자 상담",
        "result": "B지속고객",
    })
    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": p2,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "B문의자 상담",
        "result": "A가망고객",
    })

    response = await authenticated_client.get(f"/v1/consultations/?prospect_id={p1}")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 1


@pytest.mark.asyncio
async def test_get_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    create_resp = await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "상세조회 상담",
        "result": "A가망고객",
    })
    consultation_id = create_resp.json()["id"]

    response = await authenticated_client.get(f"/v1/consultations/{consultation_id}")
    assert response.status_code == 200
    assert response.json()["content"] == "상세조회 상담"


@pytest.mark.asyncio
async def test_update_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    create_resp = await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "수정전 내용",
        "result": "B지속고객",
    })
    consultation_id = create_resp.json()["id"]

    response = await authenticated_client.patch(f"/v1/consultations/{consultation_id}", json={
        "content": "수정후 내용",
        "result": "A가망고객",
    })
    assert response.status_code == 200
    assert response.json()["content"] == "수정후 내용"
    assert response.json()["result"] == "A가망고객"


@pytest.mark.asyncio
async def test_delete_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    create_resp = await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "삭제대상",
        "result": "C종료의지없음",
    })
    consultation_id = create_resp.json()["id"]

    response = await authenticated_client.delete(f"/v1/consultations/{consultation_id}")
    assert response.status_code == 200

    response = await authenticated_client.get(f"/v1/consultations/{consultation_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_prospect_consultations(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 1,
        "consultation_date": "2026-03-18T10:00:00",
        "content": "1차",
        "result": "B지속고객",
    })
    await authenticated_client.post("/v1/consultations/", json={
        "prospect_id": prospect_id,
        "consultation_order": 2,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "2차",
        "result": "A가망고객",
    })

    response = await authenticated_client.get(f"/v1/prospects/{prospect_id}/consultations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["consultation_order"] == 1  # 차수 오름차순
