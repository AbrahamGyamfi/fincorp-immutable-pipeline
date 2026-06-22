output "vpc_id" {
  value = aws_vpc.primary.id
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.primary.name
}

output "rds_sg_id" {
  value = aws_security_group.rds.id
}
