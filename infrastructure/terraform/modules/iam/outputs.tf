output "github_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider"
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role — set as AWS_ROLE_ARN in GitHub secrets"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_id" {
  description = "ID (name) of the GitHub Actions IAM role — used for inline policy attachment"
  value       = aws_iam_role.github_actions.id
}

output "app_role_arn" {
  description = "ARN of the app IAM role — attach to ECS task definition"
  value       = aws_iam_role.app.arn
}

output "app_role_id" {
  description = "ID (name) of the app IAM role"
  value       = aws_iam_role.app.id
}
