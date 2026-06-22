variable "name_prefix" {
  type = string
}

variable "schedule" {
  type = string
}

variable "retention_days" {
  description = "Days to retain backup copies in the primary vault"
  type        = number
}

variable "dr_retention_days" {
  description = "Days to retain backup copies in the DR vault (eu-central-1)"
  type        = number
  default     = 90
}

variable "vault_lock_changeable_days" {
  description = "Days the vault lock can be modified after creation (governance mode)"
  type        = number
}

variable "vault_min_retention_days" {
  description = "Vault lock minimum retention — must be <= retention_days and dr_retention_days"
  type        = number
  default     = 1
}

variable "rds_instance_arn" {
  type = string
}
