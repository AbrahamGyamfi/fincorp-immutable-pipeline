const HASHES = [
  'sha256:a3f8c1d9e2b047d2e9f1c6b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
  'sha256:b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
  'CVE-2024-38428 HIGH · CVE-2024-37370 CRITICAL · CVE-2024-37371 HIGH — GATE BLOCKED: pipeline halted at vulnerability check',
  'arn:aws:ecr:us-east-1:123456789012:repository/fincorp-api · ImageTagAlreadyExistsException: Tag [3a8d1f2c] is immutable',
  'sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
  'arn:aws:backup:us-west-2:123456789012:recovery-point:a1b2c3d4-e5f6-7890-abcd-ef1234567890 · Status: COMPLETED',
  'sha256:d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
  'fincorp-api:3a8d1f2c · Scan COMPLETE · HIGH:0 · CRITICAL:0 · Vulnerability gate PASSED → tagged :stable',
  'sha256:e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
  'RestoreJob: RUNNING · ElapsedTime: 00:18:42 · RTO target: 30m · fincorp-dr-restored · us-west-2 · AVAILABLE',
]

const GUARANTEES = [
  { value: 'SHA',  mod: 'amber',  label: 'Tag immutability\nECR rejects overwrites', accent: true },
  { value: '0',    mod: 'danger', label: 'High / Critical CVEs\nallowed past the gate' },
  { value: '≤30m', mod: 'green',  label: 'Recovery time objective\ncross-region restore' },
  { value: 'WORM', mod: 'blue',   label: 'Backup vault locked\nsnapshots cannot be deleted' },
]

export default function Hero() {
  return (
    <section className="hero section">
      <div className="hero-hash-bg" aria-hidden="true">
        {HASHES.map((h, i) => <div key={i}>{h}</div>)}
      </div>

      <div className="hero-content wrap">
        <p className="hero-eyebrow">FinCorp · Secure Supply Chain &amp; Cross-Region DR</p>

        <h1 className="hero-title">
          Immutable
          <span className="accent-word">&amp; Indestructible</span>
        </h1>

        <p className="hero-sub">
          Every artifact that reaches production is sealed to its source commit and cleared of
          High and Critical CVEs. If the primary region goes dark, the database restores in a
          different region within 30&nbsp;minutes.
        </p>

        <div className="guarantee-strip" role="list">
          {GUARANTEES.map(({ value, mod, label, accent }) => (
            <div
              key={value}
              className={`guarantee-cell${accent ? ' guarantee-cell--accent' : ''}`}
              role="listitem"
            >
              <div className={`guarantee-value guarantee-value--${mod}`}>{value}</div>
              <div className="guarantee-label" style={{ whiteSpace: 'pre-line' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
