terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary]
    }
  }
}

# ── GitHub Actions OIDC provider ──────────────────────────────────────────────
# If this provider already exists in the account, import it before applying:
#   terraform import module.iam.aws_iam_openid_connect_provider.github <arn>

resource "aws_iam_openid_connect_provider" "github" {
  provider        = aws.primary
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = var.github_oidc_thumbprints
}

# ── CI/CD role (assumed by GitHub Actions via OIDC) ───────────────────────────

resource "aws_iam_role" "github_actions" {
  provider = aws.primary
  name     = "${var.name_prefix}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_codeartifact" {
  provider = aws.primary
  name     = "codeartifact-read"
  role     = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "CodeArtifactToken"
      Effect = "Allow"
      Action = [
        "codeartifact:GetAuthorizationToken",
        "codeartifact:GetRepositoryEndpoint",
        "codeartifact:ReadFromRepository",
        "sts:GetServiceBearerToken",
      ]
      Resource = "*"
    }]
  })
}

# ── App / dashboard role (assumed by ECS task) ────────────────────────────────

resource "aws_iam_role" "app" {
  provider = aws.primary
  name     = "${var.name_prefix}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "app_dashboard" {
  provider = aws.primary
  name     = "dashboard-read"
  role     = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRRead"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:DescribeImages",
          "ecr:DescribeImageScanFindings",
        ]
        Resource = "*"
      },
      {
        Sid      = "RDSRead"
        Effect   = "Allow"
        Action   = ["rds:DescribeDBInstances"]
        Resource = "*"
      },
      {
        Sid      = "BackupRead"
        Effect   = "Allow"
        Action   = ["backup:ListRecoveryPointsByResource"]
        Resource = "*"
      }
    ]
  })
}
