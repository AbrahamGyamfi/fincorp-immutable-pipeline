# Pipeline Walkthrough

## End-to-End Flow

### Trigger
A developer pushes to `main`. GitHub Actions starts the pipeline.

### Job 1 — Build & Test (via CodeArtifact proxy)

```
1. GitHub Actions assumes the AWS IAM role via OIDC (no stored secrets)
2. Calls codeartifact:GetAuthorizationToken → short-lived token
3. npm registry pointed to CodeArtifact endpoint
4. npm ci installs from CodeArtifact (which proxies npmjs.org)
5. jest tests run — pipeline fails here if tests fail
```

Why CodeArtifact? If `express@4.18.2` is yanked from npm tomorrow, this
build still succeeds because CodeArtifact cached the package on first download.

### Job 2 — Docker Build → ECR

```
1. Multi-stage Dockerfile builds a minimal Alpine image
2. Image tagged with git SHA: fincorp-api:<sha>
3. Pushed to ECR — ECR Tag Immutability REJECTS any future attempt
   to push a different image under the same SHA tag
4. Also tagged :latest (mutable — for convenience only, never deployed directly)
```

The SHA tag is the canonical reference. All promotions reference it.

### Job 3 — Vulnerability Gate

```
1. ECR automatically scanned the image on push (scan_on_push = true)
2. Pipeline polls DescribeImageScanFindings every 10 seconds
3. Once COMPLETE, checks findingSeverityCounts.HIGH and .CRITICAL
4. If HIGH > 0 OR CRITICAL > 0 → exit 1 (pipeline blocked)
5. SARIF report uploaded to GitHub Security tab (visible even on failure)
```

This is the security contract: no image with known High/Critical CVEs
reaches production.

### Job 4 — Promote to :stable

```
1. Requires GitHub environment "production" approval (optional gate)
2. Pulls the SHA-tagged image, retags it :stable
3. Pushes :stable to ECR
```

`:stable` is the tag ECS/EKS task definitions reference. The underlying
immutable SHA layer is unchanged — :stable is just a pointer update.

---

## What "Immutable" Means in Practice

| Scenario | Result |
|----------|--------|
| Developer tries to push a "fixed" image under the same SHA | ECR rejects with `ImageTagAlreadyExistsException` |
| Malicious actor tries to overwrite `:abc1234` | ECR rejects — tag immutability blocks it |
| Audit asks "what's in production?" | Look up `:stable` → find SHA → `git show <sha>` → exact code |
| CVE discovered in a pushed image | Pipeline was already blocked at the gate; image never reached :stable |

---

## Reproducing a Past Build

```bash
# Pull the exact image from 6 months ago
docker pull <account>.dkr.ecr.eu-west-1.amazonaws.com/fincorp-api:<git-sha>

# Find the git commit it was built from
docker inspect <image> | jq '.[].Config.Labels'
# → "git.commit": "abc1234", "git.branch": "main", "build.date": "..."
```

---

## Required GitHub Secrets / Variables

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC (output from `terraform output github_actions_role_arn`) |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` — OIDC eliminates them.

---

## Setting Up From Scratch

```bash
# 1. Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply -var="github_org=<your-org>" \
                -var="db_username=fincorp" \
                -var="db_password=<min-16-chars>"

# 2. Note the outputs
terraform output

# 3. Set GitHub secrets
gh secret set AWS_ROLE_ARN     --body "$(terraform output -raw github_actions_role_arn)"
gh secret set AWS_ACCOUNT_ID   --body "$(aws sts get-caller-identity --query Account --output text)"

# 4. Configure local dev environment to use CodeArtifact
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
./infrastructure/scripts/01-setup-codeartifact.sh

# 5. Push to main to trigger the pipeline
git push origin main
```
