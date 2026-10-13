#!/usr/bin/env bash
# Frontend lint and formatting, and the email translation check; CI fails on any of them.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npm ci
npm run lint
npm run format:check
# Hard-coded text and missing catalogue keys in the emails (L2-111.1); the frontend's are the
# zamaro/no-hardcoded-text ESLint rule above.
cd ..
docker compose run --rm --no-deps api php artisan i18n:check
