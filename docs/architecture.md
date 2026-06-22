# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKSTATION                        │
│                                                                     │
│   git push → GitHub                                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS (CI/CD)                         │
│                                                                     │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  Build & Test    │→ │ Docker Build    │→ │ Vulnerability     │  │
│  │  (CodeArtifact   │  │ Push → ECR      │  │ Gate              │  │
│  │   proxy for npm) │  │ (immutable tag) │  │ FAIL on High/Crit │  │
│  └──────────────────┘  └─────────────────┘  └───────────────────┘  │
│                                                        │             │
│                                             ┌──────────▼──────────┐ │
│                                             │  Promote to :stable │ │
│                                             └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│ AWS CodeArtifact│      │    Amazon ECR         │
│                 │      │                       │
│  • npm proxy    │      │  • Tag Immutability   │
│  • PyPI proxy   │      │  • Image Scanning     │
│  • Audit logs   │      │  • KMS encryption     │
└─────────────────┘      └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      eu-west-1 (PRIMARY)                            │
│                                                                     │
│  ┌────────────────────────────────────────┐                         │
│  │  RDS PostgreSQL (Multi-AZ)             │                         │
│  │  • deletion_protection = true          │                         │
│  │  • KMS encrypted                       │                         │
│  │  • Performance Insights                │                         │
│  └────────────────┬───────────────────────┘                         │
│                   │                                                 │
│  ┌────────────────▼───────────────────────┐                         │
│  │  AWS Backup                            │                         │
│  │  • Daily snapshot @ 01:00 UTC          │──────────────────┐      │
│  │  • Retain 30 days                      │                  │      │
│  │  • WORM vault lock                     │                  │      │
│  └────────────────────────────────────────┘                  │      │
└─────────────────────────────────────────────────────────────────────┘
                                                               │
                                          Cross-Region Copy    │
                                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       eu-central-1 (DR)                             │
│                                                                     │
│  ┌────────────────────────────────────────┐                         │
│  │  AWS Backup Vault (DR)                 │                         │
│  │  • Retain 90 days                      │                         │
│  │  • KMS encrypted (separate key)        │                         │
│  └────────────────┬───────────────────────┘                         │
│                   │                                                 │
│  ┌────────────────▼───────────────────────┐                         │
│  │  Restored RDS (on DR activation)       │                         │
│  │  • Restored from backup within 30 min  │                         │
│  └────────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Immutability via ECR Tag Immutability
Every image is tagged with its git SHA (e.g., `:abc1234`). ECR's Tag Immutability setting rejects any attempt to overwrite that tag — making every production artifact permanently traceable to a specific commit.

### Vulnerability Gate
ECR Enhanced Scanning (backed by Amazon Inspector) runs automatically on push. The CI pipeline polls the scan result and exits with code 1 if any `HIGH` or `CRITICAL` CVE is found — preventing the image from being promoted to `:stable`.

### CodeArtifact Proxy (Supply Chain Security)
All npm and PyPI packages flow through CodeArtifact rather than the public registries directly. This:
- Creates an immutable cache so builds are reproducible even if a package is yanked upstream
- Enables audit logging of every package downloaded
- Allows namespace/version allow-listing in the future

### OIDC Authentication (No Long-Lived Keys)
GitHub Actions authenticates to AWS using OpenID Connect. No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` is stored in GitHub — credentials are minted per-run and expire automatically.

### RDS Multi-AZ + Deletion Protection
The primary database runs Multi-AZ for high availability within the region. `deletion_protection = true` prevents accidental or runaway automation from dropping the instance.

### AWS Backup WORM Lock
The primary backup vault uses a governance-mode lock (switchable to compliance mode). This prevents anyone — including root — from deleting backups during the retention window.
