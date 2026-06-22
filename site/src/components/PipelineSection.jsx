const STAGES = [
  { id: 'ca',    label: 'CA',  mod: '',       name: 'CodeArtifact', note: 'npm + pip\nupstream proxy' },
  { id: 'bt',    label: 'BT',  mod: '',       name: 'Build & Test', note: 'jest suite\nmust pass' },
  { id: 'df',    label: 'Df',  mod: '',       name: 'Docker Build', note: 'Alpine · non-root\nuser' },
  { id: 'ecr',   label: 'ECR', mod: 'amber',  name: 'ECR Push',     note: ':<git-sha>\nimmutable' },
  { id: 'gate',  label: '⚑',   mod: 'amber',  name: 'Vuln Gate',    note: 'High/Critical\n→ blocked', gate: true },
  { id: 'stab',  label: '✓',   mod: 'green',  name: 'Promote :stable', note: 'gate passed\nSARIF uploaded' },
]

const CARDS = [
  {
    label: 'Tag Immutability',
    body: (
      <>
        ECR is set to <code>IMMUTABLE</code>. Any push that tries to overwrite an existing SHA tag
        is rejected with <code>ImageTagAlreadyExistsException</code> — the image and its provenance
        are locked forever.
      </>
    ),
  },
  {
    label: 'Vulnerability Gate',
    body: (
      <>
        ECR Enhanced Scanning triggers on every push. The pipeline polls{' '}
        <code>DescribeImageScanFindings</code> and exits&nbsp;1 if <code>HIGH &gt; 0</code> or{' '}
        <code>CRITICAL &gt; 0</code>. SARIF results post to the GitHub Security tab regardless.
      </>
    ),
  },
  {
    label: 'CodeArtifact Proxy',
    body: (
      <>
        npm and PyPI packages are cached on first download. Builds stay reproducible even if
        upstream yanks a version — and every download is recorded in CloudTrail for audit.
      </>
    ),
  },
  {
    label: 'OIDC — No Static Keys',
    body: (
      <>
        GitHub Actions authenticates via OpenID Connect. No <code>AWS_ACCESS_KEY_ID</code> is
        stored in GitHub — credentials are minted per-run, scoped to the repository branch,
        and expire automatically.
      </>
    ),
  },
]

export default function PipelineSection() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-meta">
          <span className="meta-label">Part I — Artifact Pipeline</span>
          <span className="meta-hash">ecr:us-east-1 / scan_on_push:true / tag_mutability:IMMUTABLE</span>
        </div>
        <h2 className="section-title">Source commit to sealed image</h2>
        <p className="section-sub">
          All packages flow through a CodeArtifact proxy before the build touches them.
          The resulting Docker image lands in ECR under an immutable SHA tag — and only
          after every High and Critical CVE has been cleared.
        </p>
        <div className="section-rule" />

        {/* Pipeline trace */}
        <div className="pipeline-outer">
          <div className="pipeline-track" role="list" aria-label="Pipeline stages">
            {STAGES.map(({ id, label, mod, name, note, gate }) => (
              <div
                key={id}
                className={`stage${gate ? ' stage--gate' : ''}`}
                role="listitem"
              >
                <div className={`stage-node${mod ? ` stage-node--${mod}` : ''}`}>
                  {label}
                </div>
                <div className="stage-name">{name}</div>
                <div className="stage-note" style={{ whiteSpace: 'pre-line' }}>{note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="feature-grid">
          {CARDS.map(({ label, body }) => (
            <div key={label} className="feature-card">
              <div className="feature-card-label">{label}</div>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
