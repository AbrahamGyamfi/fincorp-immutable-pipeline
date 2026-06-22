variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "aws_region" {
  type = string
}

variable "dr_region" {
  type = string
}

variable "ecr_registry" {
  type = string
}

variable "ecr_repository" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "primary_db_id" {
  type = string
}

variable "codeartifact_domain" {
  type = string
}

variable "codeartifact_domain_owner" {
  type = string
}
