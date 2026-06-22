output "vault_name" {
  value = aws_backup_vault.primary.name
}

output "vault_arn" {
  value = aws_backup_vault.primary.arn
}

output "dr_vault_name" {
  value = aws_backup_vault.dr.name
}

output "dr_vault_arn" {
  value = aws_backup_vault.dr.arn
}

output "plan_id" {
  value = aws_backup_plan.daily.id
}

output "role_name" {
  value = aws_iam_role.backup.name
}

output "backup_alerts_topic_arn" {
  description = "SNS topic ARN — subscribe to receive backup failure notifications"
  value       = aws_sns_topic.backup_alerts.arn
}
