terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary]
    }
  }
}

# ── Latest Amazon Linux 2023 AMI ──────────────────────────────────────────────

data "aws_ami" "al2023" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── IAM role for EC2 (ECR pull + dashboard AWS calls) ────────────────────────

resource "aws_iam_role" "ec2_app" {
  provider = aws.primary
  name     = "${var.name_prefix}-ec2-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_app" {
  provider = aws.primary
  name     = "ec2-app-permissions"
  role     = aws_iam_role.ec2_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRPull"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribeImageScanFindings",
          "ecr:DescribeImages",
          "ecr:ListImages"
        ]
        Resource = "*"
      },
      {
        Sid    = "DashboardReads"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "backup:ListRecoveryPointsByResource",
          "backup:DescribeBackupJob"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_app" {
  provider = aws.primary
  name     = "${var.name_prefix}-ec2-app-profile"
  role     = aws_iam_role.ec2_app.name
}

# ── Security group: allow app port + SSH ─────────────────────────────────────

resource "aws_security_group" "app" {
  provider    = aws.primary
  name        = "${var.name_prefix}-ec2-app"
  description = "Allow HTTP on port 3000 and SSH inbound"
  vpc_id      = var.vpc_id

  ingress {
    description = "App"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-ec2-sg" }
}

# ── EC2 instance ──────────────────────────────────────────────────────────────

resource "aws_instance" "app" {
  provider                    = aws.primary
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_app.name
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    aws_region               = var.aws_region
    ecr_registry             = var.ecr_registry
    ecr_repository           = var.ecr_repository
    database_url             = var.database_url
    dr_region                = var.dr_region
    primary_db_id            = var.primary_db_id
    codeartifact_domain      = var.codeartifact_domain
    codeartifact_domain_owner = var.codeartifact_domain_owner
  })

  tags = { Name = "${var.name_prefix}-app" }
}
