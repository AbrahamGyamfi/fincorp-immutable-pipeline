terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

# ── IAM: shared role (global) ─────────────────────────────────────────────────

resource "aws_iam_role" "backup" {
  provider = aws.primary
  name     = "${var.name_prefix}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  provider   = aws.primary
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  provider   = aws.primary
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# ── Primary vault (eu-west-1) ─────────────────────────────────────────────────

resource "aws_kms_key" "vault" {
  provider                = aws.primary
  description             = "${var.name_prefix} primary backup vault encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "vault" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-backup"
  target_key_id = aws_kms_key.vault.key_id
}

resource "aws_backup_vault" "primary" {
  provider    = aws.primary
  name        = "${var.name_prefix}-backup"
  kms_key_arn = aws_kms_key.vault.arn
}

resource "aws_backup_vault_lock_configuration" "primary" {
  provider           = aws.primary
  backup_vault_name  = aws_backup_vault.primary.name
  min_retention_days = var.vault_min_retention_days
  max_retention_days = 365

  # Governance mode: lock is modifiable for this many days after creation.
  changeable_for_days = var.vault_lock_changeable_days
}

# ── DR vault (eu-central-1) ───────────────────────────────────────────────────

resource "aws_kms_key" "dr_vault" {
  provider                = aws.dr
  description             = "${var.name_prefix} DR backup vault encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "dr_vault" {
  provider      = aws.dr
  name          = "alias/${var.name_prefix}-backup-dr"
  target_key_id = aws_kms_key.dr_vault.key_id
}

resource "aws_backup_vault" "dr" {
  provider    = aws.dr
  name        = "${var.name_prefix}-backup-dr"
  kms_key_arn = aws_kms_key.dr_vault.arn
}

resource "aws_backup_vault_lock_configuration" "dr" {
  provider           = aws.dr
  backup_vault_name  = aws_backup_vault.dr.name
  min_retention_days = var.vault_min_retention_days
  max_retention_days = 365

  changeable_for_days = var.vault_lock_changeable_days
}

# ── Backup plan: daily snapshot + cross-region copy ───────────────────────────

resource "aws_backup_plan" "daily" {
  provider = aws.primary
  name     = "${var.name_prefix}-daily-backup"

  rule {
    rule_name         = "daily-snapshot"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = var.schedule
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = var.retention_days
    }

    # Cross-region copy satisfies the DR spec requirement:
    # every nightly backup is automatically replicated to eu-central-1.
    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn

      lifecycle {
        delete_after = var.dr_retention_days
      }
    }
  }

  tags = { Name = "${var.name_prefix}-daily-backup" }
}

resource "aws_backup_selection" "rds" {
  provider     = aws.primary
  name         = "${var.name_prefix}-rds"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn
  resources    = [var.rds_instance_arn]
}

# ── CloudWatch alarm: backup job failure ──────────────────────────────────────

resource "aws_sns_topic" "backup_alerts" {
  provider = aws.primary
  name     = "${var.name_prefix}-backup-alerts"
}

resource "aws_cloudwatch_metric_alarm" "backup_job_failed" {
  provider            = aws.primary
  alarm_name          = "${var.name_prefix}-backup-job-failed"
  alarm_description   = "AWS Backup job failure — daily RDS snapshot did not complete successfully"
  namespace           = "AWS/Backup"
  metric_name         = "NumberOfBackupJobsFailed"
  statistic           = "Sum"
  period              = 86400 # 24 h — fires once per day if any job failed
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.backup_alerts.arn]
  ok_actions    = [aws_sns_topic.backup_alerts.arn]
}
