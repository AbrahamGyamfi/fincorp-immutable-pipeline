terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {}
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# ── Networking ────────────────────────────────────────────────────────────────

module "networking" {
  source = "./modules/networking"

  name_prefix      = local.name_prefix
  primary_vpc_cidr = var.vpc_cidr
  az_count         = var.az_count

  providers = {
    aws.primary = aws
  }
}

# ── IAM ───────────────────────────────────────────────────────────────────────

module "iam" {
  source = "./modules/iam"

  name_prefix             = local.name_prefix
  github_org              = var.github_org
  github_repo             = var.github_repo
  github_oidc_thumbprints = var.github_oidc_thumbprints

  providers = {
    aws.primary = aws
  }
}

# ── ECR ───────────────────────────────────────────────────────────────────────

module "ecr" {
  source = "./modules/ecr"

  name_prefix             = local.name_prefix
  repository_name         = var.ecr_repository_name
  max_tagged_images       = var.ecr_max_tagged_images
  untagged_expiry_days    = var.ecr_untagged_expiry_days
  github_actions_role_arn = module.iam.github_actions_role_arn
  github_actions_role_id  = module.iam.github_actions_role_id
  app_role_arn            = module.iam.app_role_arn

  providers = {
    aws.primary = aws
  }

  depends_on = [module.iam]
}

# ── RDS ───────────────────────────────────────────────────────────────────────

module "rds" {
  source = "./modules/rds"

  name_prefix            = local.name_prefix
  engine_version         = var.db_engine_version
  instance_class         = var.db_instance_class
  allocated_storage_gb   = var.db_allocated_storage_gb
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  db_subnet_group_name   = module.networking.db_subnet_group_name
  vpc_security_group_ids = [module.networking.rds_sg_id]
  backup_retention_days  = var.db_backup_retention_days

  providers = {
    aws.primary = aws
  }

  depends_on = [module.networking]
}

# ── Backup ────────────────────────────────────────────────────────────────────

module "backup" {
  source = "./modules/backup"

  name_prefix                = local.name_prefix
  schedule                   = var.backup_schedule
  retention_days             = var.backup_retention_days
  dr_retention_days          = var.backup_dr_retention_days
  vault_lock_changeable_days = var.backup_vault_lock_changeable_days
  vault_min_retention_days   = var.backup_vault_min_retention_days
  rds_instance_arn           = module.rds.instance_arn

  providers = {
    aws.primary = aws
    aws.dr      = aws.dr
  }

  depends_on = [module.rds]
}

# ── CodeArtifact ──────────────────────────────────────────────────────────────

module "codeartifact" {
  source = "./modules/codeartifact"

  name_prefix             = local.name_prefix
  github_actions_role_arn = module.iam.github_actions_role_arn

  providers = {
    aws.primary = aws
  }

  depends_on = [module.iam]
}
