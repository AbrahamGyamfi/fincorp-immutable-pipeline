const REF_BLOCKS = [
  {
    head: 'GitHub Secrets',
    rows: [
      { label: 'AWS_ROLE_ARN',    desc: 'IAM role for OIDC — no static keys' },
      { label: 'AWS_ACCOUNT_ID',  desc: '12-digit account ID' },
    ],
  },
  {
    head: 'Key Files',
    rows: [
      { label: '.github/workflows/ci-cd.yml',  desc: 'Pipeline definition' },
      { label: 'infrastructure/terraform/',    desc: 'ECR · CodeArtifact · RDS · Backup' },
      { label: 'infrastructure/scripts/',      desc: '01 setup · 02 simulate · 03 restore' },
      { label: 'app/Dockerfile',               desc: 'Multi-stage · Alpine · non-root' },
    ],
  },
  {
    head: 'Terraform Resources',
    rows: [
      { label: 'aws_ecr_repository',                    desc: 'IMMUTABLE + KMS + scan_on_push' },
      { label: 'aws_codeartifact_domain',               desc: 'npm + PyPI proxy · KMS encrypted' },
      { label: 'aws_db_instance',                       desc: 'Multi-AZ · pg15 · deletion_protection' },
      { label: 'aws_backup_plan',                       desc: 'Daily + cross-region copy to eu-central-1' },
      { label: 'aws_backup_vault_lock_configuration',   desc: 'Governance WORM lock' },
      { label: 'aws_iam_role (OIDC)',                   desc: 'GitHub Actions · no static credentials' },
    ],
  },
  {
    head: 'Quick Start',
    rows: [
      { label: 'terraform apply',                 desc: 'Provision all infrastructure' },
      { label: '01-setup-codeartifact.sh',        desc: 'Authenticate npm + pip locally' },
      { label: 'git push origin main',            desc: 'Trigger the pipeline' },
      { label: '02-simulate-region-failure.sh',   desc: 'Delete primary — DR test begins' },
      { label: '03-restore-dr.sh',                desc: 'Restore in eu-central-1 · clock runs' },
    ],
  },
]

export default function ReferenceSection() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-meta">
          <span className="meta-label">Reference</span>
        </div>
        <h2 className="section-title">Implementation guide</h2>
        <p className="section-sub">
          Everything needed to deploy the infrastructure, run the pipeline, and execute the DR test.
        </p>
        <div className="section-rule" />

        <div className="ref-grid">
          {REF_BLOCKS.map(({ head, rows }) => (
            <div key={head} className="ref-block">
              <div className="ref-block-head">{head}</div>
              <ul className="ref-rows">
                {rows.map(({ label, desc }) => (
                  <li key={label} className="ref-row">
                    <span className="ref-key">{label}</span>
                    <span className="ref-val">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
