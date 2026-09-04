#!/usr/bin/env bash
# One-time: push this repo's production env vars into the linked Vercel project.
# Reads values straight from .env — nothing is printed or logged.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env
set +a

add() {
  local name="$1"
  local val="${!name:-}"
  if [ -z "$val" ]; then
    echo "skip (empty): $name"
    return
  fi
  vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  vercel env add "$name" production --sensitive --value "$val" --yes >/dev/null
  echo "added: $name"
}

add DATABASE_URL
add SESSION_SECRET
add GOOGLE_CLIENT_ID
add GOOGLE_CLIENT_SECRET
add GOOGLE_SITE_VERIFICATION
add NEXT_PUBLIC_RECAPTCHA_SITE_KEY
add RECAPTCHA_SECRET_KEY
add RECAPTCHA_MIN_SCORE
add GOOGLE_GA_SA_CLIENT_EMAIL
add GOOGLE_GA_SA_PRIVATE_KEY

vercel env rm NEXT_PUBLIC_APP_URL production --yes >/dev/null 2>&1 || true
vercel env add NEXT_PUBLIC_APP_URL production --value "https://splitsms.vercel.app" --yes >/dev/null
echo "added: NEXT_PUBLIC_APP_URL"

echo "Done. Redeploy with: vercel --prod"
