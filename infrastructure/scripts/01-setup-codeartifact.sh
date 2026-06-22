#!/usr/bin/env bash
# Authenticates the local environment to CodeArtifact for npm and pip.
# Run once per session; the token is valid for 12 hours.
#
# Usage:
#   PROJECT_NAME=fincorp AWS_REGION=us-east-1 ./01-setup-codeartifact.sh
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-fincorp}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DOMAIN="${PROJECT_NAME}"
NPM_REPO="${PROJECT_NAME}-npm"
PYPI_REPO="${PROJECT_NAME}-pypi"

echo "=== CodeArtifact Setup ==="
echo "Project:  $PROJECT_NAME"
echo "Domain:   $DOMAIN"
echo "Account:  $ACCOUNT_ID"
echo "Region:   $REGION"
echo ""

# ── Auth token ────────────────────────────────────────────────────────────────
echo "[1/4] Fetching auth token (valid 12 hours)..."
TOKEN=$(aws codeartifact get-authorization-token \
  --domain "$DOMAIN" \
  --domain-owner "$ACCOUNT_ID" \
  --region "$REGION" \
  --query authorizationToken \
  --output text)

# ── npm ───────────────────────────────────────────────────────────────────────
echo "[2/4] Configuring npm..."
NPM_ENDPOINT=$(aws codeartifact get-repository-endpoint \
  --domain "$DOMAIN" \
  --domain-owner "$ACCOUNT_ID" \
  --repository "$NPM_REPO" \
  --format npm \
  --region "$REGION" \
  --query repositoryEndpoint \
  --output text)

npm config set registry "$NPM_ENDPOINT"
npm config set "//${NPM_ENDPOINT#https://}:_authToken" "$TOKEN"
echo "  registry: $NPM_ENDPOINT"

# ── pip ───────────────────────────────────────────────────────────────────────
echo "[3/4] Configuring pip..."
PYPI_ENDPOINT=$(aws codeartifact get-repository-endpoint \
  --domain "$DOMAIN" \
  --domain-owner "$ACCOUNT_ID" \
  --repository "$PYPI_REPO" \
  --format pypi \
  --region "$REGION" \
  --query repositoryEndpoint \
  --output text)

pip config set global.index-url \
  "https://aws:${TOKEN}@${PYPI_ENDPOINT#https://}simple/"
echo "  index-url: $PYPI_ENDPOINT"

# ── Verify ────────────────────────────────────────────────────────────────────
echo "[4/4] Verifying connectivity..."
npm ping &>/dev/null && echo "  npm:  OK" || echo "  npm:  FAILED"
pip index versions pip &>/dev/null && echo "  pip:  OK" || echo "  pip:  FAILED"

echo ""
echo "=== CodeArtifact ready. Token expires in 12 hours. ==="
