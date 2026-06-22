terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary]
    }
  }
}

resource "aws_kms_key" "domain" {
  provider                = aws.primary
  description             = "${var.name_prefix} CodeArtifact domain encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "domain" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-codeartifact"
  target_key_id = aws_kms_key.domain.key_id
}

resource "aws_codeartifact_domain" "this" {
  provider       = aws.primary
  domain         = var.name_prefix
  encryption_key = aws_kms_key.domain.arn
}

# ── npm ───────────────────────────────────────────────────────────────────────

resource "aws_codeartifact_repository" "npm_upstream" {
  provider   = aws.primary
  repository = "npm-upstream"
  domain     = aws_codeartifact_domain.this.domain

  external_connections {
    external_connection_name = "public:npmjs"
  }
}

resource "aws_codeartifact_repository" "npm" {
  provider    = aws.primary
  repository  = "${var.name_prefix}-npm"
  domain      = aws_codeartifact_domain.this.domain
  description = "${var.name_prefix} npm — proxied through CodeArtifact"

  upstream {
    repository_name = aws_codeartifact_repository.npm_upstream.repository
  }
}

# ── PyPI ──────────────────────────────────────────────────────────────────────

resource "aws_codeartifact_repository" "pypi_upstream" {
  provider   = aws.primary
  repository = "pypi-upstream"
  domain     = aws_codeartifact_domain.this.domain

  external_connections {
    external_connection_name = "public:pypi"
  }
}

resource "aws_codeartifact_repository" "pypi" {
  provider    = aws.primary
  repository  = "${var.name_prefix}-pypi"
  domain      = aws_codeartifact_domain.this.domain
  description = "${var.name_prefix} PyPI — proxied through CodeArtifact"

  upstream {
    repository_name = aws_codeartifact_repository.pypi_upstream.repository
  }
}

# ── Repository access policy ──────────────────────────────────────────────────

data "aws_iam_policy_document" "read" {
  statement {
    sid    = "AllowCICDRead"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [var.github_actions_role_arn]
    }
    actions = [
      "codeartifact:GetAuthorizationToken",
      "codeartifact:GetRepositoryEndpoint",
      "codeartifact:ReadFromRepository",
      "codeartifact:DescribeRepository",
      "codeartifact:ListPackages",
      "codeartifact:DescribePackageVersion",
      "codeartifact:GetPackageVersionAsset",
    ]
    resources = ["*"]
  }
}

resource "aws_codeartifact_repository_permissions_policy" "npm" {
  provider        = aws.primary
  domain          = aws_codeartifact_domain.this.domain
  repository      = aws_codeartifact_repository.npm.repository
  policy_document = data.aws_iam_policy_document.read.json
}

resource "aws_codeartifact_repository_permissions_policy" "pypi" {
  provider        = aws.primary
  domain          = aws_codeartifact_domain.this.domain
  repository      = aws_codeartifact_repository.pypi.repository
  policy_document = data.aws_iam_policy_document.read.json
}

# ── Endpoint lookups ──────────────────────────────────────────────────────────

data "aws_codeartifact_repository_endpoint" "npm" {
  provider   = aws.primary
  domain     = aws_codeartifact_domain.this.domain
  repository = aws_codeartifact_repository.npm.repository
  format     = "npm"
}

data "aws_codeartifact_repository_endpoint" "pypi" {
  provider   = aws.primary
  domain     = aws_codeartifact_domain.this.domain
  repository = aws_codeartifact_repository.pypi.repository
  format     = "pypi"
}
