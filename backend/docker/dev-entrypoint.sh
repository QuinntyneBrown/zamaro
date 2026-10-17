#!/bin/sh
# Installs dependencies into the node_modules volume when it is empty or stale, then runs the command.
set -e
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci --no-audit --no-fund
fi
exec "$@"
