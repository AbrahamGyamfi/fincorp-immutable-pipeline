#!/usr/bin/env bash
# DR Simulation: simulates a primary region failure by deleting the RDS instance.
# DESTRUCTIVE — requires explicit typed confirmation before proceeding.
#
# Usage:
#   PROJECT_NAME=fincorp PRIMARY_REGION=eu-west-1 DR_REGION=eu-central-1 \
#     ./02-simulate-region-failure.sh
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-fincorp}"
PRIMARY_REGION="${PRIMARY_REGION:-${AWS_REGION:-eu-west-1}}"
DR_REGION="${DR_REGION:-eu-central-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-${PROJECT_NAME}-primary}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         DISASTER RECOVERY SIMULATION — REGION FAILURE        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Project:  $PROJECT_NAME"
echo "DB:       $DB_IDENTIFIER  ($PRIMARY_REGION)"
echo "DR vault: $DR_REGION"
echo ""
echo "Prerequisites:"
echo "  • The latest AWS Backup snapshot has been copied to $DR_REGION"
echo "  • You have confirmed this is a planned DR test"
echo ""

read -r -p "Type 'SIMULATE FAILURE' to proceed: " CONFIRM
if [ "$CONFIRM" != "SIMULATE FAILURE" ]; then
  echo "Cancelled. No changes made."
  exit 0
fi

# ── Step 1: Confirm a DR recovery point exists before destroying primary ──────
echo ""
echo "[1/4] Verifying DR backup exists in $DR_REGION..."

DB_ARN="arn:aws:rds:${PRIMARY_REGION}:${ACCOUNT_ID}:db:${DB_IDENTIFIER}"

LATEST_RECOVERY_POINT=$(aws backup list-recovery-points-by-resource \
  --resource-arn "$DB_ARN" \
  --region "$DR_REGION" \
  --query 'RecoveryPoints | sort_by(@, &CreationDate) | [-1].RecoveryPointArn' \
  --output text 2>/dev/null || echo "NONE")

if [ "$LATEST_RECOVERY_POINT" = "NONE" ] || [ -z "$LATEST_RECOVERY_POINT" ]; then
  echo "ERROR: No recovery point found in $DR_REGION."
  echo "Wait for the daily backup job to complete and copy to DR, then retry."
  exit 1
fi

echo "  Found recovery point: $LATEST_RECOVERY_POINT"

# ── Step 2: Disable deletion protection ──────────────────────────────────────
echo ""
echo "[2/4] Disabling deletion protection on $DB_IDENTIFIER..."
aws rds modify-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --no-deletion-protection \
  --apply-immediately \
  --region "$PRIMARY_REGION" \
  --output json | jq -r '.DBInstance.DBInstanceStatus'

echo "  Waiting for modification to apply..."
aws rds wait db-instance-available \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --region "$PRIMARY_REGION"

# ── Step 3: Delete the primary instance ──────────────────────────────────────
echo ""
echo "[3/4] Deleting primary RDS instance (simulating region failure)..."
START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

aws rds delete-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --skip-final-snapshot \
  --region "$PRIMARY_REGION"

echo "  Deletion initiated at $START_TIME"

# ── Step 4: Persist state for 03-restore-dr.sh ───────────────────────────────
STATE_FILE="/tmp/${PROJECT_NAME}-dr-state.env"
cat > "$STATE_FILE" <<EOF
SIMULATION_TIMESTAMP=$START_TIME
RECOVERY_POINT_ARN=$LATEST_RECOVERY_POINT
PRIMARY_REGION=$PRIMARY_REGION
DR_REGION=$DR_REGION
ORIGINAL_DB_IDENTIFIER=$DB_IDENTIFIER
PROJECT_NAME=$PROJECT_NAME
EOF

echo ""
echo "[4/4] State saved to $STATE_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " NEXT STEP: Run 03-restore-dr.sh to recover in $DR_REGION"
echo " Recovery point ARN:"
echo "   $LATEST_RECOVERY_POINT"
echo "═══════════════════════════════════════════════════════════════"
