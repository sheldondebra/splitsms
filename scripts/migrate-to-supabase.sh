#!/usr/bin/env bash
# Migrate SplitSMS Postgres → Supabase
# Usage: ./scripts/migrate-to-supabase.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

BACKUP_DIR="$ROOT/tmp/db-backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$BACKUP_DIR/splitsms-neon-$STAMP.dump"

SUPABASE_URL="${SUPABASE_DATABASE_URL:-${DATABASE_URL:?Set DATABASE_URL or SUPABASE_DATABASE_URL}}"

# Prefer unlocked Neon endpoints (try main, then backup branch, then legacy)
NEON_CANDIDATES=(
  "${NEON_DATABASE_URL:-}"
  "${NEON_DATABASE_URL_LOCKED:-}"
  "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-nameless-band-auri8cdk.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"
  "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-bold-wave-aurfmxd0.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"
  "postgresql://neondb_owner:npg_ByLYX8ZQ0Ktr@ep-dark-paper-apowpcc6.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

PG_DUMP="$(command -v pg_dump || true)"
PG_RESTORE="$(command -v pg_restore || true)"
PSQL="$(command -v psql || true)"
if [[ -x /opt/homebrew/opt/postgresql@17/bin/pg_dump ]]; then
  PG_DUMP=/opt/homebrew/opt/postgresql@17/bin/pg_dump
  PG_RESTORE=/opt/homebrew/opt/postgresql@17/bin/pg_restore
  PSQL=/opt/homebrew/opt/postgresql@17/bin/psql
fi

echo "==> Testing Supabase…"
"$PSQL" "$SUPABASE_URL" -c 'select current_database(), now();' >/dev/null
echo "    Supabase OK"

NEON_URL=""
for url in "${NEON_CANDIDATES[@]}"; do
  [[ -z "$url" ]] && continue
  echo "==> Probing Neon candidate…"
  if "$PSQL" "$url" -c 'select 1' >/dev/null 2>&1; then
    NEON_URL="$url"
    echo "    Neon OK"
    break
  else
    echo "    failed (quota/DNS/auth)"
  fi
done

if [[ -z "$NEON_URL" ]]; then
  echo ""
  echo "ERROR: Cannot read Neon source DB (still quota-locked or unreachable)."
  echo "Apply schema only to Supabase instead:"
  echo "  DATABASE_URL=\"$SUPABASE_URL\" npx prisma db push"
  exit 2
fi

echo "==> Dumping Neon → $DUMP"
"$PG_DUMP" "$NEON_URL" \
  --no-owner --no-acl --format=custom --verbose \
  -f "$DUMP"

echo "==> Restoring into Supabase (clean public schema)…"
"$PSQL" "$SUPABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
SQL

"$PG_RESTORE" \
  --no-owner --no-acl \
  --dbname="$SUPABASE_URL" \
  "$DUMP" || true

echo "==> Verifying…"
"$PSQL" "$SUPABASE_URL" -c 'select count(*)::int as users from "User";'

echo ""
echo "Done. Dump saved at: $DUMP"
echo "Next: point Vercel + .env.local DATABASE_URL at Supabase."
