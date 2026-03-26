"""
이비가푸드 AI 자산화 업무툴 — 시드 데이터 생성 스크립트

테스트 계정:
  - admin@ebiga.com / admin1234 (관리자)
  - testuser@ebiga.com / test1234 (점포개발 매니저)

실행: cd backend && python seed.py
"""
import asyncio
from datetime import datetime, timezone, timedelta

from app.database import engine, AsyncSessionLocal
from app.models.base import Base
from app.models.user import User, UserRole, DepartmentType
from app.models.prospect import Prospect, InquiryPath, ProspectStatus
from app.models.consultation import Consultation, ConsultationResult
from app.models.store import Store, StoreStatus
from app.models.store_inspection import StoreInspection, QualityStatus, HygieneStatus
from app.models.improvement_task import ImprovementTask, TaskCategory, TaskPriority, TaskStatus
from app.utils.security import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ─── 1. 사용자 계정 ───
        admin = User(
            email="admin@ebiga.com",
            password_hash=hash_password("admin1234"),
            role=UserRole.ADMIN,
            name="시스템관리자",
            department=DepartmentType.ADMIN,
        )
        dev_manager = User(
            email="testuser@ebiga.com",
            password_hash=hash_password("test1234"),
            role=UserRole.MANAGER,
            name="김점포",
            department=DepartmentType.DEV,
        )
        dev_staff = User(
            email="devstaff@ebiga.com",
            password_hash=hash_password("test1234"),
            role=UserRole.STAFF,
            name="이상담",
            department=DepartmentType.DEV,
        )
        sv_manager = User(
            email="svmanager@ebiga.com",
            password_hash=hash_password("test1234"),
            role=UserRole.MANAGER,
            name="박슈퍼",
            department=DepartmentType.SUPERVISOR,
        )
        supervisor1 = User(
            email="supervisor1@ebiga.com",
            password_hash=hash_password("test1234"),
            role=UserRole.STAFF,
            name="최점검",
            department=DepartmentType.SUPERVISOR,
        )
        executive = User(
            email="executive@ebiga.com",
            password_hash=hash_password("test1234"),
            role=UserRole.MANAGER,
            name="정임원",
            department=DepartmentType.EXECUTIVE,
        )
        db.add_all([admin, dev_manager, dev_staff, sv_manager, supervisor1, executive])
        await db.flush()

        # ─── 2. 가맹문의자 ───
        now = datetime.now(timezone.utc)

        p1 = Prospect(
            name="홍길동",
            phone="010-5555-0001",
            email="hong@email.com",
            inquiry_path=InquiryPath.INTERNET_SEARCH,
            hope_region="서울 강남",
            startup_budget=8000,
            status=ProspectStatus.IN_CONSULTATION,
            assigned_user_id=dev_manager.id,
            memo="부부 운영 희망, 시식 완료 후 긍정적 반응",
        )
        p2 = Prospect(
            name="김영희",
            phone="010-5555-0002",
            email="kim@email.com",
            inquiry_path=InquiryPath.REFERRAL,
            hope_region="경기 분당",
            startup_budget=6000,
            status=ProspectStatus.NEW,
            assigned_user_id=dev_staff.id,
        )
        p3 = Prospect(
            name="이철수",
            phone="010-5555-0003",
            inquiry_path=InquiryPath.STORE_VISIT,
            hope_region="부산 해운대",
            startup_budget=5000,
            status=ProspectStatus.CONTRACTED,
            assigned_user_id=dev_manager.id,
            memo="계약 완료, 해운대센텀 인근 매장 확보 진행 중",
        )
        p4 = Prospect(
            name="박지영",
            phone="010-5555-0004",
            inquiry_path=InquiryPath.MEDIA_AD,
            hope_region="대구 수성",
            startup_budget=7000,
            status=ProspectStatus.IN_CONSULTATION,
            assigned_user_id=dev_staff.id,
            memo="시식 예약 요청",
        )
        p5 = Prospect(
            name="최민수",
            phone="010-5555-0005",
            inquiry_path=InquiryPath.OTHER,
            hope_region="인천 연수",
            startup_budget=4000,
            status=ProspectStatus.CLOSED,
        )
        db.add_all([p1, p2, p3, p4, p5])
        await db.flush()

        # ─── 3. 상담 기록 ───
        consultations = [
            Consultation(
                prospect_id=p1.id,
                consultation_order=1,
                consultant_id=dev_manager.id,
                consultation_date=now - timedelta(days=14),
                content="1차 상담. 강남 지역 매장 문의. 8천만원 예산, 부부 운영 희망. 메뉴 시식 완료, 맛에 만족.",
                result=ConsultationResult.POSITIVE,
                next_action="2차 상담 시 실제 매장 방문 안내",
            ),
            Consultation(
                prospect_id=p1.id,
                consultation_order=2,
                consultant_id=dev_staff.id,
                consultation_date=now - timedelta(days=7),
                content="2차 상담. 강남역 인근 후보 매장 2곳 안내. 투자비 상세 설명. 가족 동의 필요 언급.",
                result=ConsultationResult.POSITIVE,
                next_action="가족 상담 후 3차 상담 일정 조율",
            ),
            Consultation(
                prospect_id=p3.id,
                consultation_order=1,
                consultant_id=dev_manager.id,
                consultation_date=now - timedelta(days=30),
                content="1차 상담. 매장 직접 방문하여 문의. 해운대 지역 관심, 시식 후 바로 긍정적 반응.",
                result=ConsultationResult.POSITIVE,
                next_action="계약 조건 안내",
            ),
            Consultation(
                prospect_id=p3.id,
                consultation_order=2,
                consultant_id=dev_manager.id,
                consultation_date=now - timedelta(days=20),
                content="2차 상담. 계약 조건 합의. 해운대센텀 인근 매장 확보 진행.",
                result=ConsultationResult.CLOSED,
                next_action="계약서 작성",
            ),
            Consultation(
                prospect_id=p4.id,
                consultation_order=1,
                consultant_id=dev_staff.id,
                consultation_date=now - timedelta(days=5),
                content="1차 상담. 매체광고 보고 전화 문의. 대구 수성구 관심. 예산 7천만원. 시식 예약 요청.",
                result=ConsultationResult.NEUTRAL,
                next_action="시식 일정 안내 (이번주 토요일)",
            ),
        ]
        db.add_all(consultations)
        await db.flush()

        # ─── 4. 가맹점 ───
        s1 = Store(
            store_name="서울강남역점",
            region="서울",
            address="서울특별시 강남구 강남대로 396",
            supervisor_id=supervisor1.id,
            status=StoreStatus.OPERATING,
        )
        s2 = Store(
            store_name="부산해운대센텀점",
            region="부산",
            address="부산광역시 해운대구 센텀로 100",
            supervisor_id=supervisor1.id,
            status=StoreStatus.OPERATING,
        )
        s3 = Store(
            store_name="대전둔산점",
            region="대전",
            address="대전광역시 서구 둔산로 100",
            supervisor_id=sv_manager.id,
            status=StoreStatus.OPERATING,
        )
        s4 = Store(
            store_name="인천송도점",
            region="인천",
            address="인천광역시 연수구 송도로 200",
            supervisor_id=supervisor1.id,
            status=StoreStatus.PAUSED,
        )
        db.add_all([s1, s2, s3, s4])
        await db.flush()

        # ─── 5. 점포 점검 기록 ───
        inspections = [
            StoreInspection(
                store_id=s1.id,
                supervisor_id=supervisor1.id,
                inspection_date=now - timedelta(days=7),
                quality_status=QualityStatus.GOOD,
                quality_notes="면 물붓기 시간 정확, 염도 적정, 야채 볶음 표준 준수",
                hygiene_status=HygieneStatus.GOOD,
                hygiene_notes="주방 및 홀 청결 상태 양호",
                sales_note="월 매출 4,200만원, 전년 대비 8.5% 증가",
                owner_feedback="직원 채용 어려움 호소, 주말 아르바이트 추가 희망",
            ),
            StoreInspection(
                store_id=s1.id,
                supervisor_id=supervisor1.id,
                inspection_date=now - timedelta(days=37),
                quality_status=QualityStatus.POOR,
                quality_notes="면 물붓기 시간 초과, 개선 필요",
                hygiene_status=HygieneStatus.GOOD,
                hygiene_notes="전반적 양호",
                sales_note="월 매출 4,000만원, 전월 대비 2.1% 감소",
            ),
            StoreInspection(
                store_id=s2.id,
                supervisor_id=supervisor1.id,
                inspection_date=now - timedelta(days=3),
                quality_status=QualityStatus.GOOD,
                quality_notes="모든 메뉴 표준 준수",
                hygiene_status=HygieneStatus.POOR,
                hygiene_notes="냉장고 내부 정리 필요, 유통기한 관리 미흡",
                sales_note="월 매출 5,100만원, 전년 대비 12% 증가",
                owner_feedback="매출 상승 추세, 주방 보조 1명 추가 채용 예정",
            ),
            StoreInspection(
                store_id=s3.id,
                supervisor_id=sv_manager.id,
                inspection_date=now - timedelta(days=10),
                quality_status=QualityStatus.POOR,
                quality_notes="염도 초과, 야채 볶음 온도 미달",
                hygiene_status=HygieneStatus.POOR,
                hygiene_notes="바닥 기름때, 환풍구 청소 필요",
                sales_note="월 매출 2,800만원, 전년 대비 5% 감소. 인근 대형 프랜차이즈 입점으로 경쟁 심화",
                owner_feedback="매출 하락으로 어려움. 프로모션 지원 요청",
            ),
        ]
        db.add_all(inspections)
        await db.flush()

        # ─── 6. 개선 과제 ───
        tasks = [
            ImprovementTask(
                store_id=s1.id,
                inspection_id=inspections[1].id,
                category=TaskCategory.QUALITY,
                task_description="면 물붓기 시간 준수 교육 재실시 (표준: 3분 30초)",
                priority=TaskPriority.HIGH,
                status=TaskStatus.COMPLETED,
                due_date=now - timedelta(days=20),
            ),
            ImprovementTask(
                store_id=s2.id,
                inspection_id=inspections[2].id,
                category=TaskCategory.HYGIENE,
                task_description="냉장고 내부 정리 및 유통기한 관리 체계 수립",
                priority=TaskPriority.HIGH,
                status=TaskStatus.IN_PROGRESS,
                due_date=now + timedelta(days=7),
            ),
            ImprovementTask(
                store_id=s3.id,
                inspection_id=inspections[3].id,
                category=TaskCategory.QUALITY,
                task_description="염도 조절 교육 실시 (표준 레시피 재교육)",
                priority=TaskPriority.HIGH,
                status=TaskStatus.PENDING,
                due_date=now + timedelta(days=5),
            ),
            ImprovementTask(
                store_id=s3.id,
                inspection_id=inspections[3].id,
                category=TaskCategory.HYGIENE,
                task_description="바닥 및 환풍구 특별 청소 (외부 업체 투입)",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.PENDING,
                due_date=now + timedelta(days=10),
            ),
            ImprovementTask(
                store_id=s3.id,
                inspection_id=inspections[3].id,
                category=TaskCategory.SALES,
                task_description="매출 회복을 위한 지역 프로모션 기획 (전단지, SNS)",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.PENDING,
                due_date=now + timedelta(days=14),
            ),
        ]
        db.add_all(tasks)

        await db.commit()
        print("시드 데이터 생성 완료!")
        print()
        print("테스트 계정:")
        print("  admin@ebiga.com / admin1234 (관리자)")
        print("  testuser@ebiga.com / test1234 (점포개발 매니저)")
        print("  devstaff@ebiga.com / test1234 (점포개발 담당자)")
        print("  svmanager@ebiga.com / test1234 (슈퍼바이저 매니저)")
        print("  supervisor1@ebiga.com / test1234 (슈퍼바이저)")
        print("  executive@ebiga.com / test1234 (경영진)")
        print()
        print(f"가맹문의자: {5}건")
        print(f"상담 기록: {len(consultations)}건")
        print(f"가맹점: {4}곳")
        print(f"점검 기록: {len(inspections)}건")
        print(f"개선 과제: {len(tasks)}건")


if __name__ == "__main__":
    asyncio.run(seed())
