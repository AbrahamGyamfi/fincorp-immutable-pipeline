terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary]
    }
  }
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.primary_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.name_prefix}-vpc" }
}

resource "aws_subnet" "private" {
  provider          = aws.primary
  count             = var.az_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = { Name = "${var.name_prefix}-private-${count.index}" }
}

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "rds" {
  provider    = aws.primary
  name        = "${var.name_prefix}-rds"
  description = "Allow PostgreSQL from within the VPC only"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-rds-sg" }
}
