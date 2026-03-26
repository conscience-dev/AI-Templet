import uuid

import pytest
from httpx import AsyncClient

FAKE_UUID = str(uuid.uuid4())


async def _create_prospect(client: AsyncClient, phone: str = "010-1234-5678") -> str:
    """헬퍼: 가맹문의자 생성 후 ID 반환."""
    resp = await client.post("/v1/prospects/", json={
        "name": "테스트문의자",
        "phone": phone,
        "inquiry_path": "매장방문",
    })
    return resp.json()["id"]


async def _create_consultation(
    client: AsyncClient,
    prospect_id: str,
    order: int = 1,
    content: str = "상담 내용",
    result: str = "긍정",
    consultation_date: str = "2026-03-20T10:00:00",
    next_action: str | None = None,
) -> dict:
    """헬퍼: 상담 기록 생성 후 응답 반환."""
    payload = {
        "consultation_order": order,
        "consultation_date": consultation_date,
        "content": content,
        "result": result,
    }
    if next_action is not None:
        payload["next_action"] = next_action

    resp = await client.post(f"/v1/prospects/{prospect_id}/consultations", json=payload)
    assert resp.status_code == 200, f"상담 생성 실패: {resp.text}"
    return resp.json()


@pytest.mark.asyncio
async def test_create_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    response = await authenticated_client.post(f"/v1/prospects/{prospect_id}/consultations", json={
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "1차 상담 진행. 강남 지역 관심, 예산 5천만원.",
        "result": "긍정",
        "next_action": "2차 상담 시 매장 방문 안내",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["consultation_order"] == 1
    assert data["result"] == "긍정"
    assert data["prospect_name"] == "테스트문의자"


@pytest.mark.asyncio
async def test_get_consultation(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    create_data = await _create_consultation(
        authenticated_client, prospect_id,
        content="상세조회 상담", result="긍정",
    )
    consultation_id = create_data["id"]

    response = await authenticated_client.get(f"/v1/consultations/{consultation_id}")
    assert response.status_code == 200
    assert response.json()["content"] == "상세조회 상담"


@pytest.mark.asyncio
async def test_get_consultation_not_found(authenticated_client: AsyncClient):
    response = await authenticated_client.get(f"/v1/consultations/{FAKE_UUID}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_prospect_consultations(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    await _create_consultation(
        authenticated_client, prospect_id,
        order=1, consultation_date="2026-03-18T10:00:00",
        content="1차", result="보통",
    )
    await _create_consultation(
        authenticated_client, prospect_id,
        order=2, consultation_date="2026-03-20T10:00:00",
        content="2차", result="긍정",
    )

    response = await authenticated_client.get(f"/v1/prospects/{prospect_id}/consultations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["consultation_order"] == 1  # 차수 오름차순


@pytest.mark.asyncio
async def test_create_consultation_invalid_result(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    response = await authenticated_client.post(f"/v1/prospects/{prospect_id}/consultations", json={
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "상담 내용",
        "result": "존재하지않는결과",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_consultation_invalid_prospect(authenticated_client: AsyncClient):
    response = await authenticated_client.post(f"/v1/prospects/{FAKE_UUID}/consultations", json={
        "consultation_order": 1,
        "consultation_date": "2026-03-20T10:00:00",
        "content": "상담 내용",
        "result": "긍정",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_consultation_with_next_action(authenticated_client: AsyncClient):
    prospect_id = await _create_prospect(authenticated_client)

    data = await _create_consultation(
        authenticated_client, prospect_id,
        content="상담 내용", result="보통",
        next_action="다음 주 매장 방문 예정",
    )
    assert data["next_action"] == "다음 주 매장 방문 예정"
