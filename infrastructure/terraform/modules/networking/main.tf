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

# ── Internet Gateway (required for public subnets) ────────────────────────────

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = { Name = "${var.name_prefix}-igw" }
}

# ── Private subnets (RDS) ─────────────────────────────────────────────────────

resource "aws_subnet" "private" {
  provider          = aws.primary
  count             = var.az_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = { Name = "${var.name_prefix}-private-${count.index}" }
}

# ── Public subnets (EC2) ──────────────────────────────────────────────────────

resource "aws_subnet" "public" {
  provider                = aws.primary
  count                   = var.az_count
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.primary_vpc_cidr, 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.name_prefix}-public-${count.index}" }
}

resource "aws_route_table" "public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = { Name = "${var.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public" {
  provider       = aws.primary
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── Subnet group for RDS ──────────────────────────────────────────────────────

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
}

# ── Security group: RDS (allows PostgreSQL from within the VPC) ───────────────

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
