variable "name_prefix" {
  description = "Short identifier prefixed to every resource name"
  type        = string
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "allocated_storage_gb" {
  description = "Initial allocated storage in GB"
  type        = number
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group (from networking module)"
  type        = string
}

variable "vpc_security_group_ids" {
  description = "Security group IDs for the RDS instance (from networking module)"
  type        = list(string)
}

variable "backup_retention_days" {
  description = "Days to retain automated RDS point-in-time backups"
  type        = number
}
