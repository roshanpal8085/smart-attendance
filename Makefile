.PHONY: up down logs migrate seed test-backend test-web shell-db build help

# ════════════════════════════════════════════════════════════════
# Smart Attendance — Makefile
# ════════════════════════════════════════════════════════════════

COMPOSE        = docker compose
BACKEND_SVC    = backend
POSTGRES_SVC   = postgres
ADMIN_WEB_SVC  = admin-web

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Stack lifecycle ──────────────────────────────────────────────
up: ## Start all services in detached mode
	$(COMPOSE) up -d

down: ## Stop and remove all containers
	$(COMPOSE) down

logs: ## Follow logs for all services (Ctrl-C to exit)
	$(COMPOSE) logs -f

build: ## Rebuild all images without cache
	$(COMPOSE) build --no-cache

# ── Database ─────────────────────────────────────────────────────
migrate: ## Run Alembic migrations inside the backend container
	$(COMPOSE) exec $(BACKEND_SVC) alembic upgrade head

seed: ## Seed the database with demo data (runs inside the backend container)
	$(COMPOSE) exec $(BACKEND_SVC) python /scripts/seed_data.py

shell-db: ## Open a psql shell in the postgres container
	$(COMPOSE) exec $(POSTGRES_SVC) psql -U attendance_user -d attendance_db

# ── Testing ──────────────────────────────────────────────────────
test-backend: ## Run pytest suite inside the backend container
	$(COMPOSE) exec $(BACKEND_SVC) python -m pytest tests/ -v --tb=short

test-web: ## Run Next.js test suite inside the admin-web container
	$(COMPOSE) exec $(ADMIN_WEB_SVC) npm test -- --watchAll=false
