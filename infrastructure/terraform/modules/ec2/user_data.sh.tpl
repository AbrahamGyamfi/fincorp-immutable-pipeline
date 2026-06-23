#!/bin/bash
exec > /var/log/user-data.log 2>&1
echo "=== FinCorp App Bootstrap $(date) ==="

# Ensure SSM agent is running (pre-installed on AL2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install Docker with retries
for i in 1 2 3; do
  dnf install -y docker && break
  echo "dnf attempt $i failed, retrying..."
  sleep 15
done

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Authenticate to ECR — retry until instance IAM credentials are available
for i in $(seq 1 10); do
  if aws ecr get-login-password --region ${aws_region} | \
       docker login --username AWS --password-stdin ${ecr_registry}; then
    echo "ECR login succeeded"
    break
  fi
  echo "ECR login attempt $i/10 failed, retrying in 15s..."
  sleep 15
done

IMAGE="${ecr_registry}/${ecr_repository}:stable"

# Pull image — retry up to 30 min (pipeline may still be running)
echo "Waiting for image: $IMAGE"
for i in $(seq 1 60); do
  if docker pull "$IMAGE"; then
    echo "Image pulled on attempt $i"
    break
  fi
  echo "Attempt $i/60: image not ready, retrying in 30s..."
  sleep 30
done

# Run the app container (proceed even if pull never succeeded — SSM deploy will fix it)
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
  "$IMAGE" || echo "Container start will be retried by SSM deploy job"

echo "=== Bootstrap complete $(date) ==="
