import DrCanvas from './DrCanvas'

const METRICS = [
  { value: '24', unit: 'h', label: 'RPO — daily snapshot' },
  { value: '≤30', unit: 'm', label: 'RTO — restore target' },
  { value: '90', unit: 'd', label: 'Retention — DR vault' },
  { value: '2', unit: null, label: 'AWS regions active' },
]

const STEPS = [
  {
    num: '01',
    title: 'Deploy primary RDS',
    body: 'PostgreSQL 15 in us-east-1 with Multi-AZ standby, KMS encryption, deletion protection, and Performance Insights enabled.',
  },
  {
    num: '02',
    title: 'Configure AWS Backup',
    body: 'Backup plan runs at 01:00 UTC daily. Cross-Region Copy sends each snapshot to us-west-2 immediately. WORM vault lock prevents deletion.',
  },
  {
    num: '03',
    title: 'Simulate region failure',
    body: 'Script verifies a DR copy exists, disables deletion protection, then deletes the primary instance — mirroring a total regional outage.',
    highlight: true,
  },
  {
    num: '04',
    title: 'Restore in us-west-2',
    body: 'AWS Backup restore job runs against the DR vault. Script polls every 30 s, prints elapsed time, and reports whether the 30-minute RTO was met.',
    highlight: true,
  },
]

export default function DrSection() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-meta">
          <span className="meta-label">Part II — Disaster Recovery</span>
          <span className="meta-hash">us-east-1 → us-west-2 / rpo:24h / rto:≤30m</span>
        </div>
        <h2 className="section-title">Cross-region restore in under 30 minutes</h2>
        <p className="section-sub">
          Daily snapshots replicate automatically from us-east-1 to us-west-2.
          A scripted simulation — deleting the primary instance — demonstrates recovery time
          against a measured clock.
        </p>
        <div className="section-rule" />

        {/* Metrics bar */}
        <div className="dr-metrics" role="list">
          {METRICS.map(({ value, unit, label }) => (
            <div key={label} className="dr-metric" role="listitem">
              <div className="dr-metric-value">
                {value}{unit && <sup>{unit}</sup>}
              </div>
              <div className="dr-metric-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Canvas: animated replication diagram */}
        <DrCanvas />

        {/* Steps — genuinely sequential, numbers earn their place */}
        <div className="dr-steps">
          {STEPS.map(({ num, title, body, highlight }) => (
            <div key={num} className={`dr-step${highlight ? ' dr-step--highlight' : ''}`}>
              <div className="dr-step-num">{num}</div>
              <div className="dr-step-title">{title}</div>
              <div className="dr-step-body">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
