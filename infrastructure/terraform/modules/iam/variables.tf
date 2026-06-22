variable "name_prefix" {
  description = "Short identifier prefixed to every resource name"
  type        = string
}

variable "github_org" {
  description = "GitHub organisation or username for the OIDC trust condition"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name for the OIDC trust condition"
  type        = string
}

variable "github_oidc_thumbprints" {
  description = "GitHub Actions OIDC TLS thumbprints"
  type        = list(string)
}
