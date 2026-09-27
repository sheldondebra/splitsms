#!/usr/bin/env bash
# Safely compare sources and re-migrate ONLY if a newer Neon/Cloud SQL source is available.
# Never drops Supabase until a successful dump of the better source exists.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env.local ]]; then set -a; source .env.local; set +a; fi
if [[ -f .env ]]; then set -a; source .env; set +a; fi

PSQL=/opt/homebrew/opt/postgresql@17/bin/psql
PG_DUMP=/opt/homebrew/opt/postgresql@17/bin/pg_dump
PG_RESTORE=/opt/homebrew/opt/postgresql@17/bin/pg_restore
SUPA="${DATABASE_URL:?DATABASE_URL missing}"
BACKUP_DIR=tmp/db-backups
mkdir -p "$BACKUP_DIR"

probe() {
  local label="$1" url="$2"
  if out=$("$PSQL" "$url" -Atc "SELECT count(*)::int || '|' || coalesce(max(\"createdAt\")::text,'') FROM \"User\";" 2>/dev/null); then
    echo "$label|$out|$url"
    return 0
  fi
  echo "$label|UNREACHABLE|"
  return 1
}

echo "==> Probing databases…"
SUPA_INFO=$(probe SUPABASE "$SUPA" || true)
PROD1=$(probe NEON_PROD "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-nameless-band-auri8cdk.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require" || true)
PROD2=$(probe NEON_BACKUP_BRANCH "postgresql://neondb_owner:npg_fIMn2ErW5xtu@ep-bold-wave-aurfmxd0.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require" || true)
OLD=$(probe NEON_OLD "postgresql://neondb_owner:npg_ByLYX8ZQ0Ktr@ep-dark-paper-apowpcc6.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require" || true)
CLOUD=$(probe CLOUDSQL "postgresql://splitsms_app:G2A7RnYHebvT514L7J6GcrPFHemUjseJ@34.123.250.81:5432/splitsms?sslmode=require" || true)

printf '%s\n' "$SUPA_INFO" "$PROD1" "$PROD2" "$OLD" "$CLOUD" | tee "$BACKUP_DIR/source-probe.txt"

pick_best() {
  local best_label="" best_users=0 best_date="" best_url=""
  while IFS='|' read -r label users date url; do
    [[ "$users" == "UNREACHABLE" || -z "$users" ]] && continue
    [[ -z "$url" ]] && continue
    # Prefer newer latest_user date; tie-break on user count
    if [[ -z "$best_date" || "$date" > "$best_date" || ( "$date" == "$best_date" && "$users" -gt "$best_users" ) ]]; then
      best_label=$label; best_users=$users; best_date=$date; best_url=$url
    fi
  done < "$BACKUP_DIR/source-probe.txt"
  echo "$best_label|$best_users|$best_date|$best_url"
}

BEST=$(pick_best)
BEST_LABEL=$(echo "$BEST" | cut -d'|' -f1)
BEST_USERS=$(echo "$BEST" | cut -d'|' -f2)
BEST_DATE=$(echo "$BEST" | cut -d'|' -f3)
BEST_URL=$(echo "$BEST" | cut -d'|' -f4-)

echo ""
echo "==> Best source: $BEST_LABEL ($BEST_USERS users, latest $BEST_DATE)"

SUPA_USERS=$(echo "$SUPA_INFO" | cut -d'|' -f2)
SUPA_DATE=$(echo "$SUPA_INFO" | cut -d'|' -f3)

if [[ "$BEST_LABEL" == "SUPABASE" || -z "$BEST_URL" ]]; then
  echo "Supabase already has the best reachable data. No re-migrate needed."
  "$PSQL" "$SUPA" -c "SELECT count(*)::int AS providers FROM \"SmsProvider\"; SELECT count(*)::int AS routes FROM \"SmsRoute\";"
  exit 0
fi

if [[ "$BEST_DATE" < "$SUPA_DATE" ]]; then
  echo "Supabase data is newer than best alternate source. Keeping Supabase as-is."
  exit 0
fi

if [[ "$BEST_DATE" == "$SUPA_DATE" && "$BEST_USERS" -le "$SUPA_USERS" ]]; then
  echo "Supabase already matches best source. Keeping as-is."
  exit 0
fi

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DUMP="$BACKUP_DIR/splitsms-from-${BEST_LABEL}-$STAMP.dump"
SAFETY="$BACKUP_DIR/supabase-safety-$STAMP.dump"

echo "==> Safety dump of current Supabase → $SAFETY"
"$PG_DUMP" "$SUPA" --no-owner --no-acl --format=custom -f "$SAFETY"

echo "==> Dumping $BEST_LABEL → $DUMP"
"$PG_DUMP" "$BEST_URL" --no-owner --no-acl --format=custom -f "$DUMP"

echo "==> Restoring $BEST_LABEL into Supabase (after successful dump)…"
"$PSQL" "$SUPA" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
SQL
"$PG_RESTORE" --no-owner --no-acl --dbname="$SUPA" "$DUMP" || true

echo "==> Verify"
"$PSQL" "$SUPA" -c "
SELECT
  (SELECT count(*)::int FROM \"User\") AS users,
  (SELECT count(*)::int FROM \"Message\") AS messages,
  (SELECT count(*)::int FROM \"SmsProvider\") AS providers,
  (SELECT max(\"createdAt\") FROM \"User\") AS latest_user,
  (SELECT max(\"createdAt\") FROM \"Message\") AS latest_msg;
"
echo "Done. Safety dump kept at $SAFETY"
