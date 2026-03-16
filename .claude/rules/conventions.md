# 코드 컨벤션

## 공통
- 언어: 한국어 (에러 메시지, UI 텍스트, 주석, 테스트 데이터)
- 파일명: kebab-case (`use-toast.ts`, `alert-dialog.tsx`)
- 컴포넌트: PascalCase (`AlertDialog`, `CardTitle`)
- 변수/함수: camelCase (프론트엔드), snake_case (백엔드)

## 보안
- 환경변수: `.env`에 저장, 코드에 하드코딩 금지
- 비밀번호: bcrypt 해시 저장 (`hash_password()`)
- SQL 인젝션: SQLAlchemy ORM 사용 (raw SQL 금지)
- XSS: `dangerouslySetInnerHTML`은 마크다운 렌더러에서만 허용

## Git
- 커밋 메시지: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` 접두사
- 브랜치: `feature/{name}`, `fix/{name}`, `release/{version}`
