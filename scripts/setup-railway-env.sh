#!/usr/bin/env bash
# ============================================================
# setup-railway-env.sh
# Railway 환경변수 자동 설정
# 사용법: bash scripts/setup-railway-env.sh
# ============================================================
set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Railway CLI 확인
command -v railway >/dev/null 2>&1 || error "Railway CLI가 설치되어 있지 않습니다."

# ============================================================
# SECRET_KEY 자동 생성
# ============================================================
info "SECRET_KEY 자동 생성 중..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# ============================================================
# 필수 환경변수 설정
# ============================================================
info "Railway 환경변수 설정 중..."

railway variables set SECRET_KEY="$SECRET_KEY"
ok "SECRET_KEY 설정 완료 (자동 생성)"

railway variables set ENV_NAME=production
ok "ENV_NAME=production"

railway variables set DEBUG=False
ok "DEBUG=False"

railway variables set SESSION_COOKIE_SECURE=True
ok "SESSION_COOKIE_SECURE=True"

railway variables set SESSION_COOKIE_SAMESITE=none
ok "SESSION_COOKIE_SAMESITE=none"

railway variables set ACCESS_TOKEN_EXPIRATION_MINUTES=30
ok "ACCESS_TOKEN_EXPIRATION_MINUTES=30"

railway variables set REFRESH_TOKEN_EXPIRATION_MINUTES=10080
ok "REFRESH_TOKEN_EXPIRATION_MINUTES=10080 (7일)"

railway variables set PAGINATION_PER_PAGE=10
ok "PAGINATION_PER_PAGE=10"

# ============================================================
# 수동 설정 안내
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN}자동 설정 완료!${NC}"
echo "============================================================"
echo ""
echo "다음 환경변수는 수동으로 설정하세요:"
echo ""
echo -e "${YELLOW}[필수]${NC}"
echo "  CORS_ALLOWED_ORIGINS    # 프론트엔드 배포 URL (예: https://app.example.com)"
echo "  FRONTEND_URL            # 프론트엔드 배포 URL"
echo "  SESSION_COOKIE_DOMAIN   # 쿠키 도메인 (예: .example.com)"
echo ""
echo -e "${YELLOW}[프론트엔드 서비스]${NC}"
echo "  NEXT_PUBLIC_API_URL     # 백엔드 API URL (예: https://api.example.com)"
echo ""
echo -e "${YELLOW}[선택 - AI 에이전트]${NC}"
echo "  ANTHROPIC_API_KEY       # Anthropic API 키"
echo "  EMBEDDING_API_KEY       # 임베딩 API 키"
echo "  QDRANT_URL              # Qdrant 서버 URL"
echo "  QDRANT_API_KEY          # Qdrant API 키"
echo ""
echo "설정 명령어:"
echo "  railway variables set KEY=VALUE"
echo ""
echo "또는 Railway 대시보드에서 설정할 수 있습니다."
echo "============================================================"
