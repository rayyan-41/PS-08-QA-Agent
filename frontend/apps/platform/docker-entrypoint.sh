#!/bin/sh
set -eu
case "${VITE_USE_MOCKS:-false}" in
  ""|false) ;;
  *) echo "Production mock mode is forbidden." >&2; exit 1 ;;
esac
# jq escapes JSON strings; all values below are public browser configuration.
jq -n \
  --arg api "${VITE_API_BASE_URL:-}" \
  --arg platform "${VITE_PLATFORM_URL:-}" \
  --arg portal "${VITE_PORTAL_URL:-}" \
  --arg apiKey "${VITE_FIREBASE_API_KEY:-}" \
  --arg domain "${VITE_FIREBASE_AUTH_DOMAIN:-}" \
  --arg project "${VITE_FIREBASE_PROJECT_ID:-}" \
  --arg appId "${VITE_FIREBASE_APP_ID:-}" \
  '{VITE_API_BASE_URL:$api,VITE_PLATFORM_URL:$platform,VITE_PORTAL_URL:$portal,VITE_FIREBASE_API_KEY:$apiKey,VITE_FIREBASE_AUTH_DOMAIN:$domain,VITE_FIREBASE_PROJECT_ID:$project,VITE_FIREBASE_APP_ID:$appId,VITE_USE_MOCKS:"false"}' \
  > /usr/share/nginx/html/config.json
exec nginx -g 'daemon off;'
