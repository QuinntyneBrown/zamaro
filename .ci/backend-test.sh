#!/usr/bin/env bash
# Backend checks (ADR-0027): lint, formatting, types, the dependency audit (L2-078.2) and the Vitest
# integration tests, which run against a real Postgres and Redis from inside the API container.
set -euo pipefail
cd "$(dirname "$0")/.."
cp -n backend/.env.example backend/.env || true
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps api sh -c "npm ci --no-audit --no-fund && npm run lint && npm run format:check && npm run typecheck && npm audit --audit-level=high && npm test"
