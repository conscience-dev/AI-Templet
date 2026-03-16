# ============================================================
# Docker Compose
# ============================================================
up:
	docker-compose up

build:
	docker-compose up --build

docker-makemigrations:
	docker-compose run --rm backend sh -c "alembic revision --autogenerate -m '$(filter-out $@,$(MAKECMDGOALS))'"

docker-migrate:
	docker-compose run --rm backend sh -c "alembic upgrade head"

docker-test:
	docker-compose run --rm backend sh -c "pytest -v"

docker-testfile:
	docker-compose run --rm backend sh -c "pytest $(filter-out $@,$(MAKECMDGOALS)) -v"

docker-run:
	docker-compose run --rm backend sh -c "$(filter-out $@,$(MAKECMDGOALS))"

# ============================================================
# 로컬 백엔드
# ============================================================
backend-install:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

backend-run:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

backend-test:
	cd backend && . .venv/bin/activate && pytest -v

# ============================================================
# 로컬 프론트엔드
# ============================================================
frontend-install:
	cd frontend && npm install

frontend-run:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

# ============================================================
# Alembic 마이그레이션 (로컬)
# ============================================================
makemigrations:
	cd backend && . .venv/bin/activate && alembic revision --autogenerate -m "$(filter-out $@,$(MAKECMDGOALS))"

migrate:
	cd backend && . .venv/bin/activate && alembic upgrade head

# ============================================================
# 시딩 & DB
# ============================================================
seed:
	cd backend && . .venv/bin/activate && python seed.py

db-reset:
	cd backend && rm -f dev.db && . .venv/bin/activate && alembic upgrade head && python seed.py

# ============================================================
# 통합 명령어
# ============================================================
install: backend-install frontend-install

test: backend-test frontend-build

deploy-check: test frontend-lint
	@echo "=== Deploy check passed. deploy.yml에서 Railway 배포가 트리거됩니다. ==="

# ============================================================
# 배포 (GitHub + Railway)
# ============================================================
deploy-init:
	@command -v gh >/dev/null 2>&1 || { echo "gh CLI가 필요합니다: https://cli.github.com"; exit 1; }
	@command -v railway >/dev/null 2>&1 || { echo "Railway CLI가 필요합니다: https://docs.railway.app/guides/cli"; exit 1; }
	bash scripts/deploy-init.sh $(filter-out $@,$(MAKECMDGOALS))

deploy-env:
	bash scripts/setup-railway-env.sh

deploy:
	railway up --detach

deploy-status:
	railway status

deploy-logs-backend:
	railway logs --service backend

deploy-logs-frontend:
	railway logs --service frontend

clean:
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	rm -f backend/dev.db backend/test.db

# 더미 규칙 (인자를 Make 타겟으로 해석하지 않도록)
%:
	@:
