variable "name_prefix" {
  description = "Short identifier prefixed to every resource name"
  type        = string
}

variable "repository_name" {
  description = "ECR repository name"
  type        = string
}

variable "max_tagged_images" {
  description = "Maximum number of tagged images to retain"
  type        = number
}

variable "untagged_expiry_days" {
  description = "Days before untagged images are expired"
  type        = number
}

variable "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role (for push access)"
  type        = string
}

variable "github_actions_role_id" {
  description = "ID of the GitHub Actions IAM role (for inline policy attachment)"
  type        = string
}

variable "app_role_arn" {
  description = "ARN of the app IAM role (for pull access)"
  type        = string
}
