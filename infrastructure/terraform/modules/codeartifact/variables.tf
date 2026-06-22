variable "name_prefix" {
  description = "Short identifier prefixed to every resource name"
  type        = string
}

variable "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role (granted read access to repositories)"
  type        = string
}
