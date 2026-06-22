output "account_id" {
  value = local.account_id
}

# ── App .env ──────────────────────────────────────────────────────────────────

output "ecr_registry" {
  description = "ECR registry host — set as ECR_REGISTRY in app .env"
  value       = "${local.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "ecr_repository_url" {
  description = "Full ECR repository URL"
  value       = module.ecr.repository_url
}

output "primary_db_identifier" {
  description = "RDS instance identifier — set as PRIMARY_DB_ID in app .env"
  value       = module.rds.instance_identifier
}

output "primary_db_endpoint" {
  description = "RDS endpoint — use to build DATABASE_URL"
  value       = module.rds.endpoint
  sensitive   = true
}

# ── GitHub secrets ────────────────────────────────────────────────────────────

output "github_actions_role_arn" {
  description = "Set as AWS_ROLE_ARN in GitHub repository secrets"
  value       = module.iam.github_actions_role_arn
}

output "aws_account_id" {
  description = "Set as AWS_ACCOUNT_ID in GitHub repository secrets"
  value       = local.account_id
}

# ── CodeArtifact ──────────────────────────────────────────────────────────────

output "npm_proxy" {
  value = module.codeartifact.npm_endpoint
}

output "pypi_proxy" {
  value = module.codeartifact.pypi_endpoint
}

# ── Backup ────────────────────────────────────────────────────────────────────

output "backup_vault" {
  value = module.backup.vault_name
}

# ── Networking ────────────────────────────────────────────────────────────────

output "vpc_id" {
  value = module.networking.vpc_id
}

output "app_role_arn" {
  description = "App IAM role ARN — attach to ECS task definition"
  value       = module.iam.app_role_arn
}
