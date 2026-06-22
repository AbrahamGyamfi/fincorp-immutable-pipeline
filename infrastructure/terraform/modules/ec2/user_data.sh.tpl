#!/bin/bash
set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "=== FinCorp App Bootstrap ==="

# Install Docker
dnf update -y
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Authenticate to ECR (instance role provides credentials)
aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${ecr_registry}

IMAGE="${ecr_registry}/${ecr_repository}:stable"

# Retry until the pipeline has pushed the image (up to 30 min)
echo "Waiting for image: $IMAGE"
for i in $(seq 1 60); do
  if docker pull "$IMAGE" 2>/dev/null; then
    echo "Image pulled on attempt $i"
    break
  fi
  echo "Attempt $i/60: image not ready, retrying in 30s..."
  sleep 30
done

# Run the app container
docker run -d \
  --name fincorp-api \
  --restart always \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e AWS_REGION=${aws_region} \
  -e DR_REGION=${dr_region} \
  -e ECR_REGISTRY=${ecr_registry} \
  -e ECR_REPOSITORY=${ecr_repository} \
  -e PRIMARY_DB_ID=${primary_db_id} \
  -e DATABASE_URL="${database_url}" \
  -e CODEARTIFACT_DOMAIN=${codeartifact_domain} \
  -e CODEARTIFACT_DOMAIN_OWNER=${codeartifact_domain_owner} \
  "$IMAGE"

echo "=== App running on port 3000 ==="
