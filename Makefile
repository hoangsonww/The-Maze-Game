# The Maze Game — project Makefile.
# Run `make` or `make help` for the full list.

# --- config ---------------------------------------------------------------
REGISTRY     ?= ghcr.io
OWNER        ?= hoangsonww
TAG          ?= local
BACKEND_IMG  ?= $(REGISTRY)/$(OWNER)/the-maze-game-backend
FRONTEND_IMG ?= $(REGISTRY)/$(OWNER)/the-maze-game-frontend
PY_DIR       := src/python

NPM  := npm
NODE := node

.DEFAULT_GOAL := help
.PHONY: help install install-py install-all dev start \
        lint format format-check \
        test test-py test-all \
        build openapi openapi-validate secret seed smoke check-db \
        docker-build docker-build-backend docker-build-frontend \
        docker-up docker-down docker-logs docker-push \
        ci clean

help: ## Show this help
	@awk 'BEGIN{FS=":.*##"; printf "\nThe Maze Game — make targets\n\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2} \
		/^## /{printf "\n\033[1m%s\033[0m\n", substr($$0,4)}' $(MAKEFILE_LIST)
	@echo ""

## Setup
install: ## Install Node dependencies
	$(NPM) ci

install-py: ## Install the Python package (mazeforge) with dev extras
	pip install -e "$(PY_DIR)[dev]"

install-all: install install-py ## Install everything (Node + Python)

## Develop
dev: ## Run the API server with hot reload (nodemon)
	$(NPM) run dev

start: ## Start the API server
	$(NPM) start

## Quality
lint: ## Run ESLint
	$(NPM) run lint

format: ## Format the whole repo with Prettier
	$(NPM) run format

format-check: ## Check formatting (CI gate)
	$(NPM) run format:check

## Test
test: ## Run the JS test suite (Jest)
	$(NPM) test

test-py: ## Run the Python test suite (pytest)
	pytest $(PY_DIR)

test-all: test test-py ## Run all tests (JS + Python)

## Build & utilities
build: ## Build the static frontend into frontend-dist/
	$(NODE) scripts/build-frontend.js

openapi: ## Export the OpenAPI spec to openapi.json
	$(NODE) scripts/export-openapi.js

openapi-validate: ## Validate the OpenAPI spec (CI gate)
	$(NODE) scripts/validate-openapi.js

secret: ## Print a strong random JWT secret
	@$(NODE) scripts/gen-secret.js

seed: ## Seed the leaderboard with demo data (needs MONGODB_URI)
	$(NODE) scripts/seed-leaderboard.js

smoke: ## Smoke-test a running API (API_BASE=...)
	$(NODE) scripts/smoke-test.js

check-db: ## Check datastore connectivity
	$(NODE) scripts/check-db.js

## Docker
docker-build-backend: ## Build the backend image
	docker build -f Dockerfile.backend -t $(BACKEND_IMG):$(TAG) .

docker-build-frontend: ## Build the frontend image
	docker build -f Dockerfile.frontend -t $(FRONTEND_IMG):$(TAG) .

docker-build: docker-build-backend docker-build-frontend ## Build both images

docker-up: ## Start the full stack (backend + frontend + mongo)
	docker compose up --build -d

docker-down: ## Stop the stack and remove volumes
	docker compose down -v

docker-logs: ## Tail stack logs
	docker compose logs -f

docker-push: docker-build ## Build and push both images to the registry
	docker push $(BACKEND_IMG):$(TAG)
	docker push $(FRONTEND_IMG):$(TAG)

## Meta
ci: format-check test openapi-validate build ## Run the core CI gate locally
	@echo "CI gate passed."

clean: ## Remove build artifacts and caches
	rm -rf frontend-dist openapi.json coverage logs \
		$(PY_DIR)/build $(PY_DIR)/*.egg-info $(PY_DIR)/.pytest_cache \
		$(PY_DIR)/.mypy_cache
	find $(PY_DIR) -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned."
