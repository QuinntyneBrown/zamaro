#!/usr/bin/env bash
# Backend integration tests plus the dependency audit (ignores are listed in composer.json, ADR-0004).
set -euo pipefail
cd "$(dirname "$0")/.."
cp -n backend/.env.example backend/.env
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps api sh -c "composer install --no-interaction && php artisan key:generate --force && composer audit && php artisan test"
