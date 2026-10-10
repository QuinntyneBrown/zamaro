#!/usr/bin/env bash
# Builds every Angular application. NG_BUILD_MANGLE=0 keeps perf-test profiles readable.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npm ci
npx ng build zamaro
npx ng build admin
NG_BUILD_MANGLE=0 npx ng build perf-test
