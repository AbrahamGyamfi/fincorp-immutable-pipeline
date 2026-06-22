import { usePolling } from '../hooks/usePolling'

const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']
const SEV_CLASS = {
  CRITICAL:      'sev--critical',
  HIGH:          'sev--high',
  MEDIUM:        'sev--medium',
  LOW:           'sev--low',
  INFORMATIONAL: 'sev--info',
}

export default function SecurityPanel() {
  const { data, error, loading } = usePolling('/api/security')

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Security Gate</span>
        {data && (
          <span className={`badge badge--${data.gate_status === 'PASSED' ? 'pass' : 'blocked'}`}>
            {data.gate_status}
          </span>
        )}
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Fetching scan results…</p>}
        {error   && <p className="state-msg state-msg--error">Error: {error}</p>}

        {data && (
          <>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Image: <span style={{ color: 'var(--accent)' }}>{data.image_tag}</span>
              {' · '}
              Scanned {new Date(data.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            <div className="severity-grid">
              {SEV_ORDER.map((sev) => (
                <div key={sev} className="sev-cell">
                  <span className={`sev-value ${SEV_CLASS[sev]}`}>
                    {data.counts[sev] ?? 0}
                  </span>
                  <span className="sev-label">{sev.slice(0, 4)}</span>
                </div>
              ))}
            </div>

            {data.findings.length > 0 && (
              <>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Medium findings (gate did not block these)
                </p>
                {data.findings.map((f) => (
                  <div key={f.id} className="finding-row">
                    <span className="finding-id">{f.id}</span>
                    <span className="finding-package">{f.package} {f.version}</span>
                    <span className="finding-fix">fix: {f.fixed_in}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
