#!/bin/bash
exec > /var/log/user-data.log 2>&1
echo "=== FinCorp App Bootstrap $(date) ==="

# Install Docker
for i in 1 2 3; do
  dnf install -y docker && break
  echo "dnf attempt $i failed, retrying..."
  sleep 15
done
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

REGISTRY="${ecr_registry}"
REPO="${ecr_repository}"
IMAGE="$REGISTRY/$REPO:stable"

mkdir -p /var/lib/fincorp

# ECR login helper
cat > /usr/local/bin/ecr-login.sh << 'EOF'
#!/bin/bash
aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${ecr_registry}
EOF
chmod +x /usr/local/bin/ecr-login.sh

# Deploy script — triggered by SSM parameter written by CI/CD pipeline.
# Cron runs every minute; docker pull only happens when SHA changes.
# All env vars are hardcoded here (Terraform substitutes them at provision time)
# so we never need to re-read them from docker inspect with eval — that
# approach was broken because bash expanded $ecure inside the eval context.
cat > /usr/local/bin/fincorp-deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
LOG=/var/log/fincorp-deploy.log
LAST_SHA_FILE=/var/lib/fincorp/last-deployed-sha
IMAGE="${ecr_registry}/${ecr_repository}:stable"

TRIGGER_SHA=$(aws ssm get-parameter \
  --name /fincorp/deploy-trigger \
  --region ${aws_region} \
  --query Parameter.Value \
  --output text 2>/dev/null || echo "")

LAST_SHA=$(cat "$LAST_SHA_FILE" 2>/dev/null || echo "")

if [ -z "$TRIGGER_SHA" ] || [ "$TRIGGER_SHA" = "$LAST_SHA" ]; then
  exit 0
fi

echo "$(date): new deploy trigger $TRIGGER_SHA (was: $LAST_SHA)" >> $LOG

/usr/local/bin/ecr-login.sh >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "$(date): ECR login failed — aborting" >> $LOG
  exit 1
fi

PULL=$(docker pull "$IMAGE" 2>&1)
echo "$(date): $PULL" >> $LOG

docker stop  fincorp-api 2>/dev/null || true
docker rm    fincorp-api 2>/dev/null || true

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
  -e DATABASE_URL='${database_url}' \
  -e CODEARTIFACT_DOMAIN=${codeartifact_domain} \
  -e CODEARTIFACT_DOMAIN_OWNER=${codeartifact_domain_owner} \
  "$IMAGE" >> $LOG 2>&1

if [ $? -eq 0 ]; then
  echo "$TRIGGER_SHA" > "$LAST_SHA_FILE"
  echo "$(date): successfully deployed $TRIGGER_SHA" >> $LOG
else
  echo "$(date): docker run FAILED for $TRIGGER_SHA" >> $LOG
fi
DEPLOY_EOF
chmod +x /usr/local/bin/fincorp-deploy.sh

# Cron: poll SSM trigger every minute (cheap — only pulls when SHA changes)
echo "* * * * * root /usr/local/bin/fincorp-deploy.sh" > /etc/cron.d/fincorp-deploy

# Initial boot — pull current :stable if one exists
for i in $(seq 1 10); do
  /usr/local/bin/ecr-login.sh && break
  echo "ECR login attempt $i/10 failed, retrying in 15s..."
  sleep 15
done

echo "Waiting for :stable image..."
for i in $(seq 1 60); do
  if docker pull "$IMAGE"; then
    echo "Image pulled on attempt $i"
    break
  fi
  echo "Attempt $i/60 — retrying in 30s..."
  sleep 30
done

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
  -e DATABASE_URL='${database_url}' \
  -e CODEARTIFACT_DOMAIN=${codeartifact_domain} \
  -e CODEARTIFACT_DOMAIN_OWNER=${codeartifact_domain_owner} \
  "$IMAGE" || echo "Initial run failed — cron deploy will retry"

echo "=== Bootstrap complete $(date) ==="
