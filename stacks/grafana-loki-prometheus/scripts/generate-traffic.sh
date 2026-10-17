#!/usr/bin/env bash
# Hit the endpoints in a loop. Usage: ./generate-traffic.sh [iterations] (default: forever)
FASTAPI=${FASTAPI_URL:-http://localhost:8000}
NEXTJS=${NEXTJS_URL:-http://localhost:3001}
MAX=${1:-0}
i=0
while [ "$MAX" -eq 0 ] || [ "$i" -lt "$MAX" ]; do
  i=$((i + 1))
  for url in \
    "$FASTAPI/" "$FASTAPI/health" "$FASTAPI/slow" "$FASTAPI/error" \
    "$NEXTJS/api/proxy/root" "$NEXTJS/api/proxy/slow" "$NEXTJS/api/proxy/error"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
    echo "[$i] $code $url"
  done
  sleep 1
done
