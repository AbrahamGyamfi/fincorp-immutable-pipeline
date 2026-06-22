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

variable "multi_az" {
  description = "Enable Multi-AZ deployment (required for production HA; disable to save cost during testing)"
  type        = bool
  default     = false
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights (not supported on db.t3.micro)"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion (set true for testing to avoid blocking deletes)"
  type        = bool
  default     = true
}
