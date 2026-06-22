variable "project_name" {
  description = "Short identifier prefixed to every resource name"
  type        = string
  default     = "fincorp"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,18}[a-z0-9]$", var.project_name))
    error_message = "project_name must be 3–20 lowercase letters, digits, or hyphens, starting with a letter."
  }
}

variable "environment" {
  description = "Deployment environment tag"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment must be one of: development, staging, production."
  }
}

# ── Region ────────────────────────────────────────────────────────────────────

variable "region" {
  description = "AWS primary region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "dr_region" {
  description = "AWS disaster-recovery region — backup copies are sent here"
  type        = string
  default     = "eu-central-1"
}

# ── Networking ────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones. RDS Multi-AZ requires at least 2."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "az_count must be 2 or 3."
  }
}

# ── Database ──────────────────────────────────────────────────────────────────

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password (minimum 16 characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "Database password must be at least 16 characters."
  }
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "fincorp"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.18"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage_gb" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_backup_retention_days" {
  description = "Days to retain automated RDS point-in-time backups"
  type        = number
  default     = 1
}

variable "db_multi_az" {
  description = "Enable RDS Multi-AZ (set true for production; false saves ~$80/month during testing)"
  type        = bool
  default     = false
}

variable "db_performance_insights" {
  description = "Enable RDS Performance Insights (not supported on db.t3.micro)"
  type        = bool
  default     = false
}

# ── ECR ───────────────────────────────────────────────────────────────────────

variable "ecr_repository_name" {
  description = "ECR repository name"
  type        = string
  default     = "fincorp-api"
}

variable "ecr_max_tagged_images" {
  description = "Maximum number of tagged images to retain in ECR"
  type        = number
  default     = 50
}

variable "ecr_untagged_expiry_days" {
  description = "Days before untagged images are expired from ECR"
  type        = number
  default     = 30
}

# ── GitHub OIDC ───────────────────────────────────────────────────────────────

variable "github_org" {
  description = "GitHub organisation or username — used in the OIDC trust condition"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name — used in the OIDC trust condition"
  type        = string
  default     = "fincorp-immutable-pipeline"
}

variable "github_oidc_thumbprints" {
  description = "GitHub Actions OIDC TLS thumbprints"
  type        = list(string)
  default = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

# ── Backup ────────────────────────────────────────────────────────────────────

variable "backup_schedule" {
  description = "AWS Backup plan schedule as a cron expression"
  type        = string
  default     = "cron(0 1 * * ? *)"
}

variable "backup_retention_days" {
  description = "Days to retain backups in the primary vault"
  type        = number
  default     = 30
}

variable "backup_dr_retention_days" {
  description = "Days to retain backup copies in the DR vault (eu-central-1)"
  type        = number
  default     = 90
}

variable "backup_vault_min_retention_days" {
  description = "Vault lock minimum retention days — must be <= backup_retention_days and backup_dr_retention_days"
  type        = number
  default     = 1
}

variable "backup_vault_lock_changeable_days" {
  description = "Days the vault lock can be modified (governance mode)"
  type        = number
  default     = 3
}
