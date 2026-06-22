# Disaster Recovery Runbook

## Overview

| Item | Value |
|------|-------|
| RPO (Recovery Point Objective) | 24 hours (daily backup) |
| RTO (Recovery Time Objective) | ≤ 30 minutes |
| Primary Region | eu-west-1 |
| DR Region | eu-central-1 |
| Backup Schedule | Daily at 01:00 UTC |
| Backup Retention (primary) | 30 days |
| Backup Retention (DR) | 90 days |

---

## DR Decision Tree

```
Is the primary region (eu-west-1) unavailable?
├── YES → Activate DR (proceed to DR Activation below)
└── NO
    ├── Is a single AZ down? → RDS Multi-AZ auto-fails over (no action needed)
    └── Is the DB instance corrupt/deleted? → Restore from point-in-time backup in eu-west-1
```

---

## DR Activation Procedure

### Prerequisites
- [ ] AWS CLI configured with appropriate cross-account permissions
- [ ] `VPC_SG_IDS` for the DR VPC security group(s)
- [ ] `DB_USERNAME` and `DB_PASSWORD` for the restored instance

### Step 1 — Verify latest DR backup

```bash
aws backup list-recovery-points-by-resource \
  --resource-arn arn:aws:rds:eu-west-1:<ACCOUNT_ID>:db:fincorp-primary \
  --region eu-central-1 \
  --query 'RecoveryPoints | sort_by(@, &CreationDate) | [-1]'
```

Note the `RecoveryPointArn` and `CreationDate`. Confirm the age is within your RPO tolerance.

### Step 2 — Simulate or activate failure

**For a DR test:**
```bash
export AWS_ACCOUNT_ID=<your-account-id>
./infrastructure/scripts/02-simulate-region-failure.sh
```

**For a real incident** — skip step 2 and proceed directly to step 3 with the ARN from step 1.

### Step 3 — Restore in eu-central-1

```bash
export RECOVERY_POINT_ARN=<arn-from-step-1>
export VPC_SG_IDS=<sg-id-in-eu-central-1>
export DB_PASSWORD=<master-password>
./infrastructure/scripts/03-restore-dr.sh
```

The script polls every 30 seconds and prints elapsed time. Target completion: **≤ 30 minutes**.

### Step 4 — Update application connection strings

After the script reports `RECOVERY COMPLETE`, update the application's database connection string to point to the new endpoint (printed by the script).

For ECS/EKS deployments, update the SSM Parameter Store or Secrets Manager secret:
```bash
aws ssm put-parameter \
  --name /fincorp/db/endpoint \
  --value "<new-endpoint>:5432" \
  --type SecureString \
  --overwrite \
  --region eu-central-1
```

Then redeploy the application in eu-central-1.

### Step 5 — Smoke tests

```bash
# Verify DB connectivity
psql -h <restored-endpoint> -U fincorp -d fincorp -c "SELECT COUNT(*) FROM information_schema.tables;"

# Check application health
curl https://<dr-app-endpoint>/health
```

### Step 6 — Notify stakeholders

Send incident notification with:
- Incident start time
- DR activation time
- Actual RTO achieved
- Expected data loss (based on last backup timestamp)
- Estimated time for full restoration of primary region

---

## Failback Procedure (returning to eu-west-1)

Once the primary region is restored:

1. Take a final snapshot of the DR database
2. Export data if the DR database received writes during the incident
3. Provision a new primary RDS instance in eu-west-1 via Terraform
4. Restore from the DR snapshot using AWS Backup
5. Verify data consistency
6. Switch application connection strings back to eu-west-1
7. Re-enable the Backup plan in the primary region

---

## Monitoring & Alerts

Configure these CloudWatch alarms:

| Alarm | Threshold | Action |
|-------|-----------|--------|
| RDS CPU Utilization | > 80% for 10 min | PagerDuty |
| RDS Storage Space | < 20% free | PagerDuty |
| AWS Backup job failures | Any failure | SNS email |
| Cross-region copy failures | Any failure | PagerDuty |
| RDS instance deletion | Any deletion event | Immediate PagerDuty |

EventBridge rule for instance deletion:
```json
{
  "source": ["aws.rds"],
  "detail-type": ["RDS DB Instance Event"],
  "detail": {
    "EventCategories": ["deletion"]
  }
}
```
