#!/usr/bin/env bash
# Backend checks (ADR-0027, ADR-0028): lint, formatting, types, the dependency audit (L2-078.2), the
# Vitest suite on an in-memory PGlite database, the OpenAPI export and the production build. No Docker.
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm ci --no-audit --no-fund
npm run lint
npm run format:check
npm run typecheck
npm audit --audit-level=high
npm test
npm run openapi:check
npm run build
