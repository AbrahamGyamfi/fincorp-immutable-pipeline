import { usePolling } from '../hooks/usePolling'

const SEVS = [
  { key: 'CRITICAL',      cls: 'critical', short: 'Crit' },
  { key: 'HIGH',          cls: 'high',     short: 'High' },
  { key: 'MEDIUM',        cls: 'medium',   short: 'Med'  },
  { key: 'LOW',           cls: 'low',      short: 'Low'  },
  { key: 'INFORMATIONAL', cls: 'info',     short: 'Info' },
]

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
        {error   && <p className="state-msg state-msg--error">{error}</p>}

        {data && (
          <>
            <div className="sev-row">
              {SEVS.map(({ key, cls, short }) => {
                const n = data.counts?.[key] ?? 0
                return (
                  <div key={key} className={`sev-cell sev-cell--${cls}`}>
                    <span className={`sev-count sev-count--${n === 0 ? 'zero' : cls}`}>
                      {n}
                    </span>
                    <span className="sev-label">{short}</span>
                  </div>
                )
              })}
            </div>

            <p className="scan-meta">
              Image{' '}
              <span style={{ color: 'var(--accent)' }}>
                {data.image_tag?.slice(0, 12)}
              </span>
              {' · '}
              Scanned{' '}
              {new Date(data.scanned_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {data.findings?.length > 0 && (
              <div className="finding-list">
                {data.findings.map(f => (
                  <div key={f.id} className="finding-row">
                    <span className="finding-id">{f.id}</span>
                    <span className="finding-pkg">
                      {f.package} {f.version}
                    </span>
                    <span className="finding-fix">→ {f.fixed_in}</span>
                  </div>
                ))}
              </div>
            )}

            {data.findings?.length === 0 && (
              <p className="state-msg" style={{ paddingTop: 0, textAlign: 'left' }}>
                No open findings.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
