#!/usr/bin/env bash
# ============================================================
# deploy-init.sh
# GitHub repo 생성 + Railway 프로젝트 초기화 원커맨드 스크립트
# 사용법: bash scripts/deploy-init.sh
# ============================================================
set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ============================================================
# Step 0: CLI 도구 확인
# ============================================================
info "필수 CLI 도구 확인 중..."

command -v gh >/dev/null 2>&1 || error "gh CLI가 설치되어 있지 않습니다. https://cli.github.com 에서 설치하세요."
command -v railway >/dev/null 2>&1 || error "Railway CLI가 설치되어 있지 않습니다. https://docs.railway.app/guides/cli 에서 설치하세요."

# 인증 상태 확인
gh auth status >/dev/null 2>&1 || error "gh CLI 인증이 필요합니다. 'gh auth login'을 실행하세요."
railway whoami >/dev/null 2>&1 || error "Railway CLI 인증이 필요합니다. 'railway login'을 실행하세요."

ok "CLI 도구 및 인증 확인 완료"

# ============================================================
# Step 1: 프로젝트 이름 입력
# ============================================================
SLUG="${1:-}"
if [ -z "$SLUG" ]; then
    read -rp "프로젝트 이름을 입력하세요 (kebab-case, 예: my-project): " SLUG
fi

if [ -z "$SLUG" ]; then
    error "프로젝트 이름이 필요합니다."
fi

info "프로젝트 이름: $SLUG"

# ============================================================
# Step 2: GitHub 레포지토리 생성
# ============================================================
info "GitHub 레포지토리 확인 중..."

# 이미 remote가 설정되어 있는지 확인
if git remote get-url origin >/dev/null 2>&1; then
    EXISTING_REMOTE=$(git remote get-url origin)
    warn "이미 origin remote가 설정되어 있습니다: $EXISTING_REMOTE"
    read -rp "새 레포지토리를 생성하시겠습니까? (y/N): " CREATE_REPO
    if [[ "$CREATE_REPO" != "y" && "$CREATE_REPO" != "Y" ]]; then
        info "기존 remote를 사용합니다."
    else
        gh repo create "$SLUG" --private --source=. --push
        ok "GitHub 레포지토리 생성 완료: $SLUG"
    fi
else
    info "GitHub 레포지토리 생성 중: $SLUG (private)..."
    gh repo create "$SLUG" --private --source=. --push
    ok "GitHub 레포지토리 생성 및 초기 push 완료"
fi

# ============================================================
# Step 3: Railway 프로젝트 초기화
# ============================================================
info "Railway 프로젝트 초기화 중..."

# 워크스페이스 설정 (여러 워크스페이스가 있을 때 필요)
RAILWAY_WORKSPACE="${RAILWAY_WORKSPACE:-}"
WORKSPACE_FLAG=""
if [ -n "$RAILWAY_WORKSPACE" ]; then
    WORKSPACE_FLAG="--workspace $RAILWAY_WORKSPACE"
fi

if [ -f ".railway.json" ]; then
    warn ".railway.json이 이미 존재합니다. Railway 프로젝트가 이미 연결되어 있을 수 있습니다."
    read -rp "새 프로젝트를 생성하시겠습니까? (y/N): " CREATE_RAILWAY
    if [[ "$CREATE_RAILWAY" != "y" && "$CREATE_RAILWAY" != "Y" ]]; then
        info "기존 Railway 프로젝트를 사용합니다."
    else
        railway init --name "$SLUG" $WORKSPACE_FLAG
        ok "Railway 프로젝트 생성 완료"
    fi
else
    railway init --name "$SLUG" $WORKSPACE_FLAG
    ok "Railway 프로젝트 생성 완료"
fi

# ============================================================
# Step 4: PostgreSQL 데이터베이스 추가
# ============================================================
info "PostgreSQL 데이터베이스 추가 중..."
echo ""
warn "Railway CLI에서 PostgreSQL을 추가합니다."
warn "아래 명령어를 실행하거나, Railway 대시보드에서 수동으로 추가하세요:"
echo ""
echo "  railway add --database postgres"
echo ""
read -rp "PostgreSQL 추가를 진행하시겠습니까? (Y/n): " ADD_PG
if [[ "$ADD_PG" != "n" && "$ADD_PG" != "N" ]]; then
    railway add --database postgres || warn "PostgreSQL 추가에 실패했습니다. Railway 대시보드에서 수동으로 추가하세요."
fi

# ============================================================
# Step 5: Railway 환경변수 설정
# ============================================================
info "Railway 환경변수 설정 중..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/setup-railway-env.sh" ]; then
    bash "$SCRIPT_DIR/setup-railway-env.sh"
else
    warn "setup-railway-env.sh를 찾을 수 없습니다. 환경변수를 수동으로 설정하세요."
fi

# ============================================================
# Step 6: GitHub Actions Secrets 자동 등록
# ============================================================
info "GitHub Actions Secrets 자동 등록 중..."

# Railway 토큰
RAILWAY_TOKEN="ab6d35de-fc70-4423-b0b8-1415c6d3406f"
echo "$RAILWAY_TOKEN" | gh secret set RAILWAY_TOKEN && ok "RAILWAY_TOKEN 등록 완료"

# 서비스 ID — Railway 프로젝트 생성 직후에는 서비스가 아직 없을 수 있음
# 첫 배포(railway up) 후 서비스가 생성되면 아래 명령어로 등록:
#   gh secret set RAILWAY_BACKEND_SVC_ID
#   gh secret set RAILWAY_FRONTEND_SVC_ID
warn "서비스 ID는 첫 배포 후 Railway 대시보드에서 확인하여 등록하세요:"
echo "  gh secret set RAILWAY_BACKEND_SVC_ID"
echo "  gh secret set RAILWAY_FRONTEND_SVC_ID"

# ============================================================
# 완료
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN}초기화 완료!${NC}"
echo "============================================================"
echo ""
echo "'git push origin main' 하면 CI/CD 파이프라인이 자동 실행됩니다."
echo ""
echo "상태 확인:"
echo "  make deploy-status          # Railway 배포 상태"
echo "  make deploy-logs-backend    # 백엔드 로그"
echo "  make deploy-logs-frontend   # 프론트엔드 로그"
echo "============================================================"
