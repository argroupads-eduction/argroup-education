#!/usr/bin/env bash
# Unpublish or delete a test blog synced to production via payload-sync.
set -euo pipefail
cd ~/argroup-education/apps/frontend
SECRET=$(grep '^REVALIDATE_SECRET=' .env.production | cut -d= -f2- | tr -d '\r')
PORT=$(cat ~/.frontend-active-port 2>/dev/null || echo 3000)
SLUG="${1:-payload-sync-test}"

echo "Unpublishing slug: ${SLUG}"
curl -s -w "\nHTTP:%{http_code}\n" -X POST "http://127.0.0.1:${PORT}/api/cms/payload-sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SECRET}" \
  -d "{\"type\":\"post\",\"slug\":\"${SLUG}\",\"title\":\"Sync Test\",\"content\":\"\",\"published\":false}"
