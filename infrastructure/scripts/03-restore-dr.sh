#!/usr/bin/env bash
# DR Recovery: restores the database in the DR region from the copied backup.
# Target RTO: 30 minutes from invocation.
#
# Usage:
#   # Automatically picks up state from 02-simulate-region-failure.sh:
#   PROJECT_NAME=fincorp ./03-restore-dr.sh
#
#   # Or pass everything explicitly:
#   PROJECT_NAME=fincorp \
#   DR_REGION=eu-central-1 \
#   RECOVERY_POINT_ARN=arn:aws:backup:... \
#   VPC_SG_IDS=sg-xxxx \
#   ./03-restore-dr.sh
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-fincorp}"
STATE_FILE="/tmp/${PROJECT_NAME}-dr-state.env"

# Load state from the simulation step (values can still be overridden by env)
if [ -f "$STATE_FILE" ]; then
  # shellcheck source=/dev/null
  source "$STATE_FILE"
fi

DR_REGION="${DR_REGION:-eu-central-1}"
PRIMARY_REGION="${PRIMARY_REGION:-${AWS_REGION:-eu-west-1}}"
RECOVERY_POINT_ARN="${RECOVERY_POINT_ARN:?Set RECOVERY_POINT_ARN or run 02-simulate-region-failure.sh first}"
RESTORED_DB_NAME="${RESTORED_DB_NAME:-${PROJECT_NAME}-dr-restored}"
DB_SUBNET_GROUP="${DB_SUBNET_GROUP:-${PROJECT_NAME}-dr-db-subnets}"
VPC_SG_IDS="${VPC_SG_IDS:?Set VPC_SG_IDS to the DR region security group ID}"

# Resolve the backup service role ARN from its name (no hardcoded ARN)
BACKUP_ROLE_NAME="${BACKUP_ROLE_NAME:-${PROJECT_NAME}-backup-role}"
BACKUP_ROLE_ARN=$(aws iam get-role \
  --role-name "$BACKUP_ROLE_NAME" \
  --query 'Role.Arn' \
  --output text)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           DISASTER RECOVERY — DATABASE RESTORE               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Project:        $PROJECT_NAME"
echo "Recovery Point: $RECOVERY_POINT_ARN"
echo "Target DB:      $RESTORED_DB_NAME"
echo "Target Region:  $DR_REGION"
echo "Subnet Group:   $DB_SUBNET_GROUP"
echo ""

RESTORE_START=$(date +%s)

# ── Step 1: Initiate restore job ──────────────────────────────────────────────
echo "[1/5] Initiating restore job in $DR_REGION..."

RESTORE_JOB_ID=$(aws backup start-restore-job \
  --recovery-point-arn "$RECOVERY_POINT_ARN" \
  --iam-role-arn "$BACKUP_ROLE_ARN" \
  --region "$DR_REGION" \
  --metadata \
    "DBInstanceIdentifier=$RESTORED_DB_NAME" \
    "DBSubnetGroupName=$DB_SUBNET_GROUP" \
    "VpcSecurityGroupIds=$VPC_SG_IDS" \
    "MultiAZ=false" \
    "PubliclyAccessible=false" \
    "Engine=postgres" \
  --query 'RestoreJobId' \
  --output text)

echo "  Restore job: $RESTORE_JOB_ID"

# ── Step 2: Poll until complete ───────────────────────────────────────────────
echo ""
echo "[2/5] Waiting for restore job (RTO target: 30 min)..."

while true; do
  STATUS=$(aws backup describe-restore-job \
    --restore-job-id "$RESTORE_JOB_ID" \
    --region "$DR_REGION" \
    --query 'Status' \
    --output text)

  ELAPSED=$(( $(date +%s) - RESTORE_START ))
  printf "  Status: %-12s  elapsed: %dm %ds\n" \
    "$STATUS" $(( ELAPSED / 60 )) $(( ELAPSED % 60 ))

  [ "$STATUS" = "COMPLETED" ] && break

  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "ABORTED" ]; then
    echo "ERROR: Restore job $STATUS. Check AWS Backup console."
    exit 1
  fi

  [ "$ELAPSED" -gt 2400 ] && echo "WARNING: Exceeded 40 min — RTO target likely missed."

  sleep 30
done

# ── Step 3: Wait for DB to be available ───────────────────────────────────────
echo ""
echo "[3/5] Waiting for DB instance to become available..."
aws rds wait db-instance-available \
  --db-instance-identifier "$RESTORED_DB_NAME" \
  --region "$DR_REGION"

DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RESTORED_DB_NAME" \
  --region "$DR_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "  Endpoint: $DB_ENDPOINT"

# ── Step 4: Verify connectivity ───────────────────────────────────────────────
echo ""
echo "[4/5] Verifying connectivity..."
if command -v psql &>/dev/null; then
  PGPASSWORD="${DB_PASSWORD:-}" psql \
    --host "$DB_ENDPOINT" \
    --port 5432 \
    --username "${DB_USERNAME:-${PROJECT_NAME}_admin}" \
    --dbname "${DB_NAME:-${PROJECT_NAME}}" \
    --command "SELECT version();" \
    --no-password 2>&1 | head -3 \
  && echo "  psql: CONNECTED" \
  || echo "  psql: failed (check credentials / VPN)"
else
  echo "  psql not installed — verify manually:"
  echo "    psql -h $DB_ENDPOINT -U <username> -d ${DB_NAME:-${PROJECT_NAME}}"
fi

# ── Step 5: RTO summary ───────────────────────────────────────────────────────
echo ""
TOTAL_ELAPSED=$(( $(date +%s) - RESTORE_START ))
TOTAL_MIN=$(( TOTAL_ELAPSED / 60 ))
TOTAL_SEC=$(( TOTAL_ELAPSED % 60 ))

echo "[5/5] Recovery complete."
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " RECOVERY SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo " Restore Job:   $RESTORE_JOB_ID"
echo " Restored DB:   $RESTORED_DB_NAME  ($DR_REGION)"
echo " DB Endpoint:   $DB_ENDPOINT"
echo " Total RTO:     ${TOTAL_MIN}m ${TOTAL_SEC}s"
if [ "$TOTAL_MIN" -le 30 ]; then
  echo " RTO Target:    ACHIEVED (≤30 min)"
else
  echo " RTO Target:    MISSED (>${TOTAL_MIN} min)"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Update DATABASE_URL to: postgres://<user>:<pass>@$DB_ENDPOINT:5432/${DB_NAME:-${PROJECT_NAME}}"
echo "  2. Run application smoke tests"
echo "  3. Notify stakeholders of successful DR activation"
