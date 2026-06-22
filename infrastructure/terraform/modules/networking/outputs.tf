output "vpc_id" {
  value = aws_vpc.primary.id
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.primary.name
}

output "rds_sg_id" {
  value = aws_security_group.rds.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "public_subnet_id" {
  value = aws_subnet.public[0].id
}
