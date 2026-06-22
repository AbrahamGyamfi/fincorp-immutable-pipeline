output "instance_arn" {
  description = "RDS instance ARN — used by the backup module"
  value       = aws_db_instance.primary.arn
}

output "instance_identifier" {
  description = "RDS instance identifier — set as PRIMARY_DB_ID in app env"
  value       = aws_db_instance.primary.identifier
}

output "endpoint" {
  description = "RDS endpoint — used in DATABASE_URL"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}
