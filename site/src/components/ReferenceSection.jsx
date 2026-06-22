const REF_BLOCKS = [
  {
    head: 'GitHub Secrets',
    rows: [
      { key: 'AWS_ROLE_ARN',    val: 'IAM role for OIDC — no static keys' },
      { key: 'AWS_ACCOUNT_ID',  val: '12-digit account ID' },
    ],
  },
  {
    head: 'Key Files',
    rows: [
      { key: '.github/workflows/ci-cd.yml',  val: 'Pipeline definition' },
      { key: 'infrastructure/terraform/',    val: 'ECR · CodeArtifact · RDS · Backup' },
      { key: 'infrastructure/scripts/',      val: '01 setup · 02 simulate · 03 restore' },
      { key: 'app/Dockerfile',               val: 'Multi-stage · Alpine · non-root' },
    ],
  },
  {
    head: 'Terraform Resources',
    rows: [
      { key: 'aws_ecr_repository',                    val: 'IMMUTABLE + KMS + scan_on_push' },
      { key: 'aws_codeartifact_domain',               val: 'npm + PyPI proxy · KMS encrypted' },
      { key: 'aws_db_instance',                       val: 'Multi-AZ · pg15 · deletion_protection' },
      { key: 'aws_backup_plan',                       val: 'Daily + cross-region copy to us-west-2' },
      { key: 'aws_backup_vault_lock_configuration',   val: 'Governance WORM lock' },
      { key: 'aws_iam_role (OIDC)',                   val: 'GitHub Actions · no static credentials' },
    ],
  },
  {
    head: 'Quick Start',
    rows: [
      { key: 'terraform apply',                 val: 'Provision all infrastructure' },
      { key: '01-setup-codeartifact.sh',        val: 'Authenticate npm + pip locally' },
      { key: 'git push origin main',            val: 'Trigger the pipeline' },
      { key: '02-simulate-region-failure.sh',   val: 'Delete primary — DR test begins' },
      { key: '03-restore-dr.sh',                val: 'Restore in us-west-2 · clock runs' },
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
                {rows.map(({ key, val }) => (
                  <li key={key} className="ref-row">
                    <span className="ref-key">{key}</span>
                    <span className="ref-val">{val}</span>
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
