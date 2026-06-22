locals {
  name_prefix = var.project_name
  account_id  = data.aws_caller_identity.current.account_id
}
