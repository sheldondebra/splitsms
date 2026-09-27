#!/usr/bin/env bash
# One-shot: apply schema to Supabase, then dump+restore from Neon when unlocked.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

export SUPABASE_DATABASE_URL="${SUPABASE_DATABASE_URL:-${DATABASE_URL:?DATABASE_URL missing}}"
PSQL="${PSQL:-/opt/homebrew/opt/postgresql@17/bin/psql}"

echo "==> 1) Apply Prisma schema to Supabase"
"$PSQL" "$SUPABASE_DATABASE_URL" -v ON_ERROR_STOP=1 -f tmp/db-backups/splitsms-schema.sql
echo "    schema applied"

echo "==> 2) Try full data migrate from Neon"
if SUPABASE_DATABASE_URL="$SUPABASE_DATABASE_URL" ./scripts/migrate-to-supabase.sh; then
  echo "    data migrate OK"
else
  echo "    Neon still locked — schema is ready; re-run when Neon unlocks:"
  echo "    ./scripts/migrate-to-supabase.sh"
fi

echo "==> 3) Quick check"
"$PSQL" "$SUPABASE_DATABASE_URL" -c '\dt' | head -40
