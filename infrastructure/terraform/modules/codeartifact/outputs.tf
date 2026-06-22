output "npm_endpoint" {
  description = "CodeArtifact npm endpoint — set as NPM_REGISTRY in CI"
  value       = data.aws_codeartifact_repository_endpoint.npm.repository_endpoint
}

output "pypi_endpoint" {
  description = "CodeArtifact PyPI endpoint — set as PIP_INDEX_URL in CI"
  value       = data.aws_codeartifact_repository_endpoint.pypi.repository_endpoint
}

output "domain_name" {
  value = aws_codeartifact_domain.this.domain
}
