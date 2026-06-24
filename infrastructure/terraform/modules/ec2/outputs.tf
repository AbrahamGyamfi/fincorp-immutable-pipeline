output "public_ip" {
  description = "Stable public IP (Elastic IP) of the app EC2 instance"
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "app_url" {
  description = "URL to access the app dashboard"
  value       = "http://${aws_eip.app.public_ip}:3000"
}
