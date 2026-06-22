# Architecture Overview

## Draw.io Diagram

Save the XML block below as `docs/architecture.drawio` and open it in [draw.io](https://app.diagrams.net/) or the VS Code draw.io extension.

All AWS service nodes use the official **AWS Architecture Icons (2024)** via the `mxgraph.aws4` shape library.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="1600" dy="900" grid="1" gridSize="10" guides="1" tooltips="1"
  connect="1" arrows="1" fold="1" page="1" pageScale="1"
  pageWidth="1900" pageHeight="1400" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />

    <!-- ═══════════════════════════════════════════════════════════════
         DEVELOPER + GITHUB
    ════════════════════════════════════════════════════════════════════ -->

    <!-- Developer (AWS General: User) -->
    <mxCell id="10" value="Developer" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#232F3E;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.user;" vertex="1" parent="1">
      <mxGeometry x="60" y="80" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="11" value="git push" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;" edge="1" source="10" target="20" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- GitHub (use generic Internet shape — not an AWS service) -->
    <mxCell id="20" value="GitHub" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=#232F3E;fillColor=#ffffff;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.traditional_server;" vertex="1" parent="1">
      <mxGeometry x="220" y="80" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="21" value="webhook trigger" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;" edge="1" source="20" target="30" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ═══════════════════════════════════════════════════════════════
         GITHUB ACTIONS CI/CD PIPELINE (swimlane)
    ════════════════════════════════════════════════════════════════════ -->
    <mxCell id="30" value="GitHub Actions — CI/CD Pipeline" style="swimlane;startSize=35;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=13;rounded=1;" vertex="1" parent="1">
      <mxGeometry x="360" y="30" width="1020" height="200" as="geometry" />
    </mxCell>

    <!-- Stage 1: Gitleaks -->
    <mxCell id="31" value="1. Gitleaks&#xa;Secrets Scan" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="15" y="60" width="120" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 2: CodeQL -->
    <mxCell id="32" value="2. CodeQL&#xa;SAST" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="155" y="60" width="120" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 3: Build & Test -->
    <mxCell id="33" value="3. Build &amp; Test&#xa;(CodeArtifact proxy)" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="295" y="60" width="130" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 4: Trivy -->
    <mxCell id="34" value="4. Trivy Pre-push&#xa;Scan + SBOM" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="445" y="60" width="120" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 5: Push to ECR -->
    <mxCell id="35" value="5. Push to ECR&#xa;(SHA tag)" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="585" y="60" width="120" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 6: ECR Scan Gate -->
    <mxCell id="36" value="6. ECR Scan Gate&#xa;(Amazon Inspector)" style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="725" y="60" width="130" height="60" as="geometry" />
    </mxCell>
    <!-- Stage 7: Cosign -->
    <mxCell id="37" value="7. Cosign Sign&#xa;→ promote :stable" style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;html=1;" vertex="1" parent="30">
      <mxGeometry x="875" y="60" width="130" height="60" as="geometry" />
    </mxCell>

    <!-- Stage flow arrows -->
    <mxCell id="40" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="31" target="32" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="41" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="32" target="33" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="42" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="33" target="34" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="43" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="34" target="35" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="44" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="35" target="36" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="45" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="36" target="37" parent="30"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ═══════════════════════════════════════════════════════════════
         AWS SERVICES — MIDDLE ROW
    ════════════════════════════════════════════════════════════════════ -->

    <!-- AWS CodeArtifact -->
    <mxCell id="50" value="AWS CodeArtifact&#xa;npm + PyPI proxy" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#C7131F;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.codeartifact;" vertex="1" parent="1">
      <mxGeometry x="490" y="310" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="51" value="proxy traffic" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="33" target="50" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- IAM (OIDC role) -->
    <mxCell id="55" value="AWS IAM Role&#xa;GitHub OIDC&#xa;(no long-lived keys)" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#DD344C;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.role;" vertex="1" parent="1">
      <mxGeometry x="680" y="310" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="56" value="assume via OIDC" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="20" target="55" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- AWS KMS (shared key label) -->
    <mxCell id="57" value="AWS KMS&#xa;Encryption Keys" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#DD344C;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.kms;" vertex="1" parent="1">
      <mxGeometry x="860" y="310" width="60" height="60" as="geometry" />
    </mxCell>

    <!-- Amazon ECR -->
    <mxCell id="60" value="Amazon ECR&#xa;Tag Immutability&#xa;KMS encrypted" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#C7131F;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ecr;" vertex="1" parent="1">
      <mxGeometry x="1060" y="310" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="61" value="push SHA tag" style="edgeStyle=orthogonalEdgeStyle;fontSize=10;" edge="1" source="35" target="60" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="62" value=":stable (signed)" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#82b366;fontSize=10;" edge="1" source="37" target="60" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="63" value="encrypt" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="57" target="60" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- Amazon Inspector -->
    <mxCell id="64" value="Amazon Inspector&#xa;Image Scan Gate&#xa;CRITICAL/HIGH → block" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#DD344C;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.inspector;" vertex="1" parent="1">
      <mxGeometry x="1240" y="310" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="65" value="scan on push" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="60" target="64" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="66" value="gate result" style="edgeStyle=orthogonalEdgeStyle;dashed=1;exitX=0;exitY=0.5;entryX=1;entryY=0.5;fontSize=10;" edge="1" source="64" target="36" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- Sigstore / Rekor -->
    <mxCell id="67" value="Sigstore / Rekor&#xa;Transparency Log&#xa;(Cosign keyless)" style="rounded=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;fontSize=10;html=1;" vertex="1" parent="1">
      <mxGeometry x="1420" y="310" width="140" height="60" as="geometry" />
    </mxCell>
    <mxCell id="68" value="Rekor entry" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="37" target="67" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ═══════════════════════════════════════════════════════════════
         eu-west-1  PRIMARY REGION
    ════════════════════════════════════════════════════════════════════ -->
    <mxCell id="100" value="AWS Region: eu-west-1 (Primary)" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#147EBA;fillColor=#E6F2F8;verticalLabelPosition=top;verticalAlign=bottom;align=center;spacingTop=0;fontStyle=1;fontSize=13;html=1;" vertex="1" parent="1">
      <mxGeometry x="360" y="480" width="760" height="420" as="geometry" />
    </mxCell>

    <!-- VPC -->
    <mxCell id="101" value="Amazon VPC (Multi-AZ)" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;strokeColor=#8C4FFF;fillColor=#F4EDFF;verticalLabelPosition=top;verticalAlign=bottom;align=center;spacingTop=0;fontStyle=1;fontSize=11;html=1;" vertex="1" parent="100">
      <mxGeometry x="20" y="60" width="720" height="340" as="geometry" />
    </mxCell>

    <!-- Amazon RDS (primary) -->
    <mxCell id="110" value="Amazon RDS&#xa;PostgreSQL 15&#xa;Multi-AZ | KMS&#xa;deletion_protection" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#2E73B8;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;" vertex="1" parent="101">
      <mxGeometry x="80" y="80" width="60" height="60" as="geometry" />
    </mxCell>

    <!-- RDS Security Group -->
    <mxCell id="111" value="Security Group&#xa;port 5432 (app only)" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#E7157B;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.security_group;" vertex="1" parent="101">
      <mxGeometry x="260" y="80" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="112" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="110" target="111" parent="101"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- AWS KMS primary key -->
    <mxCell id="113" value="AWS KMS&#xa;Primary Key" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#DD344C;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.kms;" vertex="1" parent="101">
      <mxGeometry x="430" y="80" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="114" value="encrypt at rest" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="113" target="110" parent="101"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- AWS Backup primary vault -->
    <mxCell id="120" value="AWS Backup Vault&#xa;Daily @ 01:00 UTC&#xa;WORM governance lock&#xa;KMS encrypted" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#E7157B;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.backup;" vertex="1" parent="101">
      <mxGeometry x="80" y="230" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="121" value="daily snapshot" style="edgeStyle=orthogonalEdgeStyle;fontSize=10;" edge="1" source="110" target="120" parent="101"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- AWS Backup plan -->
    <mxCell id="122" value="AWS Backup Plan&#xa;Schedule + Lifecycle" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#E7157B;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.backup_plan;" vertex="1" parent="101">
      <mxGeometry x="260" y="230" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="123" style="edgeStyle=orthogonalEdgeStyle;dashed=1;" edge="1" source="122" target="120" parent="101"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- CloudWatch Alarm -->
    <mxCell id="125" value="Amazon CloudWatch&#xa;Alarm: backup failed" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#E7157B;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudwatch;" vertex="1" parent="101">
      <mxGeometry x="580" y="230" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="126" value="metric alarm" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="120" target="125" parent="101"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ═══════════════════════════════════════════════════════════════
         eu-central-1  DR REGION
    ════════════════════════════════════════════════════════════════════ -->
    <mxCell id="200" value="AWS Region: eu-central-1 (DR)" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#BF0816;fillColor=#FAEBED;verticalLabelPosition=top;verticalAlign=bottom;align=center;spacingTop=0;fontStyle=1;fontSize=13;html=1;" vertex="1" parent="1">
      <mxGeometry x="1200" y="480" width="480" height="420" as="geometry" />
    </mxCell>

    <!-- DR Backup Vault -->
    <mxCell id="210" value="AWS Backup Vault (DR)&#xa;KMS encrypted (own key)&#xa;WORM lock&#xa;Retain 90 days" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#E7157B;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.backup;" vertex="1" parent="200">
      <mxGeometry x="80" y="80" width="60" height="60" as="geometry" />
    </mxCell>

    <!-- DR KMS key -->
    <mxCell id="211" value="AWS KMS&#xa;DR Key" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#DD344C;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.kms;" vertex="1" parent="200">
      <mxGeometry x="280" y="80" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="212" style="edgeStyle=orthogonalEdgeStyle;dashed=1;" edge="1" source="211" target="210" parent="200"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- Restored RDS -->
    <mxCell id="220" value="Amazon RDS&#xa;(Restored on DR)&#xa;RTO ≤ 30 min" style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;strokeColor=none;fillColor=#2E73B8;labelBackgroundColor=#ffffff;align=center;html=1;fontSize=10;fontStyle=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;" vertex="1" parent="200">
      <mxGeometry x="80" y="270" width="60" height="60" as="geometry" />
    </mxCell>
    <mxCell id="221" value="restore on DR activation" style="edgeStyle=orthogonalEdgeStyle;fontSize=10;" edge="1" source="210" target="220" parent="200"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- DR VPC -->
    <mxCell id="222" value="Amazon VPC (DR)" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;strokeColor=#8C4FFF;fillColor=#F4EDFF;verticalLabelPosition=top;verticalAlign=bottom;align=center;spacingTop=0;fontSize=10;html=1;" vertex="1" parent="200">
      <mxGeometry x="40" y="230" width="160" height="130" as="geometry" />
    </mxCell>

    <!-- ═══════════════════════════════════════════════════════════════
         CROSS-REGION COPY ARROW
    ════════════════════════════════════════════════════════════════════ -->
    <mxCell id="300" value="Cross-region copy (daily)" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#BF0816;strokeWidth=2;dashed=1;fontSize=10;html=1;" edge="1" source="120" target="210" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ECR → RDS app connection -->
    <mxCell id="310" value="app DB connection (IAM role)" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="60" target="110" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- IAM role grants ECR + Backup access -->
    <mxCell id="311" value="grants access" style="edgeStyle=orthogonalEdgeStyle;dashed=1;fontSize=10;" edge="1" source="55" target="60" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

  </root>
</mxGraphModel>
```

---

## AWS Icon Reference

| Node | AWS Icon (`mxgraph.aws4`) |
|------|--------------------------|
| Amazon ECR | `resIcon=mxgraph.aws4.ecr` |
| Amazon RDS | `resIcon=mxgraph.aws4.rds` |
| AWS Backup | `resIcon=mxgraph.aws4.backup` |
| AWS Backup Plan | `resIcon=mxgraph.aws4.backup_plan` |
| AWS CodeArtifact | `resIcon=mxgraph.aws4.codeartifact` |
| AWS IAM Role | `resIcon=mxgraph.aws4.role` |
| AWS KMS | `resIcon=mxgraph.aws4.kms` |
| Amazon Inspector | `resIcon=mxgraph.aws4.inspector` |
| Amazon CloudWatch | `resIcon=mxgraph.aws4.cloudwatch` |
| Security Group | `resIcon=mxgraph.aws4.security_group` |
| VPC | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc` |
| AWS Region | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region` |

---

## Key Design Decisions

### Immutability via ECR Tag Immutability
Every image is tagged with its git SHA (e.g., `:abc1234`). ECR Tag Immutability rejects any attempt to overwrite that tag — every production artifact is permanently traceable to a specific commit.

### Vulnerability Gate
Amazon Inspector scans every image on push. The pipeline polls the result and exits 1 on any `HIGH` or `CRITICAL` CVE, blocking promotion to `:stable`.

### CodeArtifact Proxy (Supply Chain Security)
All npm and PyPI traffic flows through CodeArtifact — immutable cache, audit logs, and future allow-listing.

### OIDC Authentication (No Long-Lived Keys)
GitHub Actions assumes an IAM role via OIDC. No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` is stored anywhere.

### RDS Multi-AZ + Deletion Protection
Primary DB runs Multi-AZ. `deletion_protection = true` prevents accidental drops. KMS encrypts all data at rest.

### AWS Backup WORM Lock
Governance-mode vault lock prevents deletion of backups during the retention window, upgradeable to compliance mode for full immutability.
