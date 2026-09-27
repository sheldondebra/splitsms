#!/usr/bin/env bash
# Non-interactive: set all DB URLs on Vercel to Supabase IPv4 pooler and redeploy.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then set -a; # shellcheck disable=SC1091
source .env.local; set +a; fi
URL="${DATABASE_URL:?Set DATABASE_URL in .env.local}"
DIRECT="${DIRECT_URL:-$DATABASE_URL_UNPOOLED}"
DIRECT="${DIRECT:?Set DIRECT_URL}"

if [[ "$URL" == *"neon.tech"* ]]; then
  echo "ERROR: DATABASE_URL still points at Neon."
  exit 1
fi
if [[ "$URL" == *"db."*".supabase.co"* ]] && [[ "$URL" != *"pooler.supabase.com"* ]]; then
  echo "ERROR: DATABASE_URL is the direct IPv6 host. Use the Supabase pooler (aws-0-REGION.pooler.supabase.com:6543)."
  exit 1
fi

POOLED_KEYS=(DATABASE_URL POSTGRES_URL POSTGRES_PRISMA_URL)
DIRECT_KEYS=(DATABASE_URL_UNPOOLED DIRECT_URL POSTGRES_URL_NON_POOLING)

echo "==> Setting Supabase pooler URLs on Vercel (production, development)"
for ENV in production development; do
  for KEY in "${POOLED_KEYS[@]}" "${DIRECT_KEYS[@]}" POSTGRES_URL_NO_SSL PGHOST PGHOST_UNPOOLED POSTGRES_HOST PGUSER POSTGRES_USER; do
    vercel env rm "$KEY" "$ENV" -y >/dev/null 2>&1 || true
  done

  for KEY in "${POOLED_KEYS[@]}"; do
    printf '%s' "$URL" | vercel env add "$KEY" "$ENV" >/dev/null
  done
  for KEY in "${DIRECT_KEYS[@]}"; do
    printf '%s' "$DIRECT" | vercel env add "$KEY" "$ENV" >/dev/null
  done
  echo "  $ENV OK"
done

echo "==> Deploying production"
vercel --prod --yes
echo "Done. Open https://www.splitsms.com/login"
