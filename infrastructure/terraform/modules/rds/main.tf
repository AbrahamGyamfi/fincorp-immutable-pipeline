terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary]
    }
  }
}

resource "aws_kms_key" "rds" {
  provider                = aws.primary
  description             = "${var.name_prefix} RDS encryption — primary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "rds" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-rds-primary"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_db_instance" "primary" {
  provider   = aws.primary
  identifier = "${var.name_prefix}-primary"

  engine            = "postgres"
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage_gb
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.vpc_security_group_ids

  multi_az            = var.multi_az
  publicly_accessible = false
  deletion_protection = true

  backup_retention_period = var.backup_retention_days
  backup_window           = "02:00-03:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.performance_insights_enabled

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = "${var.name_prefix}-primary-final-snapshot"

  tags = { Name = "${var.name_prefix}-primary-db" }
}
