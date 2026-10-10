#!/usr/bin/env bash
# Backend integration tests (with OpenAPI contract checks), the dependency audit (ignores are listed in
# composer.json, ADR-0004), Larastan with the raw-SQL rule (L2-075.2, M2 D27) and the OpenAPI 3.1 export,
# which fails on any undocumented type (ADR-0006).
set -euo pipefail
cd "$(dirname "$0")/.."
cp -n backend/.env.example backend/.env
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps api sh -c "composer install --no-interaction && php artisan key:generate --force && composer audit && vendor/bin/phpstan analyse --no-progress --memory-limit=1G && php artisan test && php artisan scramble:export --fail-on-unknown --path=storage/app/openapi.json"
