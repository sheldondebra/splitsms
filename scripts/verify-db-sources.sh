#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source .env.local 2>/dev/null || true
PSQL=/opt/homebrew/opt/postgresql@17/bin/psql
SUPA="${DATABASE_URL}"

echo "=== SUPABASE ==="
"$PSQL" "$SUPA" -c "
SELECT
  (SELECT count(*)::int FROM \"User\") AS users,
  (SELECT count(*)::int FROM \"Message\") AS messages,
  (SELECT count(*)::int FROM \"SmsProvider\") AS providers,
  (SELECT count(*)::int FROM \"SmsRoute\") AS routes,
  (SELECT count(*)::int FROM \"PlatformSetting\") AS settings,
  (SELECT max(\"createdAt\") FROM \"User\") AS latest_user,
  (SELECT max(\"createdAt\") FROM \"Message\") AS latest_msg;
"

echo "=== NEON PRODUCTION (locked project) ==="
for url in \
  "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-nameless-band-auri8cdk.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-bold-wave-aurfmxd0.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  "postgresql://neondb_owner:npg_ByLYX8ZQ0Ktr@ep-dark-paper-apowpcc6.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
do
  host=$(echo "$url" | sed -E 's#.*@([^/]+)/.*#\1#')
  echo "-- $host"
  if "$PSQL" "$url" -c "SELECT count(*)::int AS users, max(\"createdAt\") AS latest_user FROM \"User\";" 2>/tmp/neon-probe.err; then
    :
  else
    head -1 /tmp/neon-probe.err
  fi
done
