# Immutable and Indestructible — FinCorp Secure Supply Chain

A production-grade, secure CI/CD pipeline and disaster-recovery setup for FinCorp.  
Every artifact is immutable, every dependency is proxied, every backup is tamper-proof.

---

## What This Is

| Pillar | Implementation |
|--------|---------------|
| **Immutable artifacts** | ECR Tag Immutability — a pushed SHA tag can never be overwritten |
| **Supply chain security** | CodeArtifact proxies all npm and pip traffic; no direct registry access |
| **Vulnerability gate** | Trivy scans the image before push; ECR scan gates promotion to `:stable` |
| **Image signing** | Cosign keyless signing with GitHub OIDC — every `:stable` image has a Rekor entry |
| **SBOM** | CycloneDX SBOM generated per build, stored as a pipeline artifact |
| **Zero long-lived secrets** | GitHub Actions authenticates to AWS via OIDC — no stored access keys |
| **Encrypted backups** | Daily RDS snapshots, WORM vault lock, cross-region copy to `eu-central-1` |
| **30-min RTO** | Scripted restore from DR vault with live RTO timer |

---

## Architecture

```
Developer → git push → GitHub
                           │
                    GitHub Actions
                    ┌──────────────────────────────────────────┐
                    │ 1. Secrets scan (Gitleaks)               │
                    │ 2. SAST (CodeQL)                         │
                    │ 3. Build & test via CodeArtifact proxy   │
                    │ 4. Trivy pre-push scan → SBOM            │
                    │ 5. Push to ECR (immutable SHA tag)       │
                    │ 6. ECR scan gate (fail on HIGH/CRITICAL) │
                    │ 7. Cosign sign → promote to :stable      │
                    └──────────────────────────────────────────┘
                           │                    │
                    AWS CodeArtifact       Amazon ECR
                    (npm + pip proxy)      (tag immutability
                                           + KMS + scan)

eu-west-1 (primary)                    eu-central-1 (DR)
┌────────────────────────┐             ┌────────────────────────┐
│ RDS PostgreSQL         │             │ AWS Backup Vault (DR)  │
│ • Multi-AZ             │──copy──────▶│ • KMS encrypted        │
│ • deletion_protection  │  daily      │ • WORM lock            │
│ • KMS encrypted        │             │                        │
│                        │             │ Restored RDS           │
│ AWS Backup Vault       │             │ (on DR activation,     │
│ • Daily @ 01:00 UTC    │             │  within 30 min)        │
│ • WORM vault lock      │             └────────────────────────┘
└────────────────────────┘
```

Full diagram and design decisions → [docs/architecture.md](docs/architecture.md)

---

## Pipeline Stages

| Stage | Tool | Gates |
|-------|------|-------|
| Secrets scan | Gitleaks | Blocks on any leaked credential |
| SAST | CodeQL | Uploads findings to GitHub Security tab |
| Dependency review | GitHub action | Blocks PRs that introduce High+ CVEs |
| Build & test | npm / CodeArtifact | Blocks on test failure |
| Pre-push scan | Trivy | Blocks on CRITICAL or HIGH CVE (unfixed) |
| SBOM generation | Trivy (CycloneDX) | Stored 365 days as pipeline artifact |
| Push to ECR | Docker + ECR | Tag immutability enforced by ECR |
| ECR scan gate | Amazon Inspector | Blocks promotion on CRITICAL or HIGH |
| Image signing | Cosign (keyless) | Signs with GitHub OIDC; Rekor transparency log |
| Promote to `:stable` | Docker | Only reached after all gates pass |

Full job-by-job walkthrough → [docs/pipeline-walkthrough.md](docs/pipeline-walkthrough.md)

---

## Disaster Recovery

| Metric | Value |
|--------|-------|
| RPO | 24 h (daily backup) |
| RTO | ≤ 30 minutes |
| Primary region | `eu-west-1` |
| DR region | `eu-central-1` |
| Backup schedule | Daily at 01:00 UTC |
| Primary retention | 1 day (testing) — set `backup_retention_days` for production |
| DR retention | 1 day (testing) — set `backup_dr_retention_days` for production |

Full runbook (activation, failback, smoke tests) → [docs/runbook-dr.md](docs/runbook-dr.md)

---

## Repository Layout

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # 7-job pipeline (Gitleaks → Cosign)
│
├── app/
│   ├── Dockerfile                 # Multi-stage; hardened Alpine final stage
│   ├── src/
│   │   ├── server.js              # Express API
│   │   └── routes/
│   │       ├── pipeline.js        # /api/pipeline  — ECR scan status
│   │       ├── security.js        # /api/security  — CodeArtifact + IAM
│   │       ├── dr.js              # /api/dr        — backup recovery points
│   │       └── health.js          # /api/health
│   └── client/                    # React 18 + Vite dashboard
│
├── docs/
│   ├── architecture.md            # System diagram + design decisions
│   ├── pipeline-walkthrough.md    # Step-by-step pipeline explanation
│   └── runbook-dr.md              # DR activation, failback, monitoring
│
└── infrastructure/
    ├── scripts/
    │   ├── 01-setup-codeartifact.sh       # Configure local npm/pip → CodeArtifact
    │   ├── 02-simulate-region-failure.sh  # DESTRUCTIVE: delete primary RDS (DR test)
    │   └── 03-restore-dr.sh               # Restore DB in eu-central-1, print RTO
    │
    └── terraform/
        ├── main.tf                # Root: two AWS providers (primary + dr alias)
        ├── variables.tf
        ├── terraform.tfvars       # ← git-ignored; copy from terraform.tfvars.example
        └── modules/
            ├── networking/        # VPC, subnets, RDS security group
            ├── iam/               # OIDC provider, GitHub Actions role, app role
            ├── ecr/               # Repository, lifecycle policy, push/pull policies
            ├── rds/               # PostgreSQL 15, Multi-AZ, KMS, deletion protection
            ├── backup/            # Primary vault + DR vault + cross-region copy + CloudWatch alarm
            └── codeartifact/      # Domain, npm repo, PyPI repo, upstream proxies
```

---

## Quick Start

### 1. Prerequisites

- Terraform ≥ 1.6
- AWS CLI configured for `eu-west-1` (account `195275667627`)
- `gh` CLI (for setting GitHub secrets)

### 2. Deploy infrastructure

```bash
cd infrastructure/terraform

cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set db_username, db_password, github_org, github_repo

terraform init
terraform plan
terraform apply
```

### 3. Set GitHub secrets

```bash
# From the terraform output:
gh secret set AWS_ROLE_ARN   --body "$(terraform output -raw github_actions_role_arn)"
gh secret set AWS_ACCOUNT_ID --body "$(terraform output -raw aws_account_id)"
```

### 4. Configure the app environment

```bash
cp app/.env.example app/.env
# Fill in ECR_REGISTRY, DATABASE_URL from terraform output
terraform output
```

### 5. Configure local npm/pip → CodeArtifact (optional, for local dev)

```bash
./infrastructure/scripts/01-setup-codeartifact.sh
```

### 6. Push to trigger the pipeline

```bash
git push origin main
```

---

## Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `AWS_ROLE_ARN` | `terraform output -raw github_actions_role_arn` |
| `AWS_ACCOUNT_ID` | `aws sts get-caller-identity --query Account --output text` |

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` — OIDC eliminates long-lived keys entirely.

---

## Disaster Recovery — Quick Reference

```bash
# 1. Run a DR test (DESTRUCTIVE — deletes the primary RDS instance)
./infrastructure/scripts/02-simulate-region-failure.sh

# 2. Restore database in eu-central-1 (target: ≤ 30 min)
export VPC_SG_IDS=<sg-id-in-eu-central-1>
./infrastructure/scripts/03-restore-dr.sh
```

Both scripts source a shared state file so you can run them in sequence without passing ARNs manually.  
Full procedure → [docs/runbook-dr.md](docs/runbook-dr.md)

---

## Terraform Variable Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `region` | `eu-west-1` | Primary AWS region |
| `dr_region` | `eu-central-1` | DR region for backup copies |
| `backup_retention_days` | `1` (testing) | Primary vault retention |
| `backup_dr_retention_days` | `1` (testing) | DR vault retention |
| `backup_vault_min_retention_days` | `1` | Vault lock floor — must be ≤ retention |
| `db_backup_retention_days` | `1` (testing) | RDS automated snapshot retention |
| `backup_vault_lock_changeable_days` | `3` | Window to modify governance-mode vault lock |

> **Production:** raise `backup_retention_days` to `30`, `backup_dr_retention_days` to `90`, and `backup_vault_min_retention_days` to `7` before hardening the vault lock.

---

## Security Properties

- **No long-lived AWS credentials** — OIDC only
- **No mutable image tags in production** — ECR tag immutability
- **No unscanned images promoted** — dual gate (Trivy pre-push + ECR post-push)
- **No unsigned images** — Cosign keyless signing on every `:stable` promotion
- **No deleted backups** — WORM vault lock (governance mode, modifiable 3 days)
- **No direct registry access** — all package traffic through CodeArtifact
- **No secrets in CI** — `db_password` lives in `terraform.tfvars` (git-ignored), never in Actions
