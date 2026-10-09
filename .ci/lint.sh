#!/usr/bin/env bash
# Frontend lint and formatting; CI fails on either.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npm ci
npm run lint
npm run format:check
