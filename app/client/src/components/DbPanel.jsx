import { usePolling } from '../hooks/usePolling'

export default function DbPanel() {
  const { data, error, loading } = usePolling('/api/health', 10_000)

  const isOk = data?.db === 'connected'

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Database Health</span>
        {data && (
          <span className={`badge badge--${isOk ? 'pass' : 'blocked'}`}>
            {isOk ? 'Connected' : 'Disconnected'}
          </span>
        )}
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Pinging database…</p>}
        {error   && (
          <div className="db-status-row">
            <span className="db-indicator db-indicator--error" aria-hidden="true" />
            <span className="db-label">Connection failed</span>
            <span className="db-value" style={{ color: 'var(--danger)' }}>{error}</span>
          </div>
        )}

        {data && (
          <>
            <div className="db-status-row">
              <span
                className={`db-indicator db-indicator--${isOk ? 'ok' : 'error'}`}
                aria-hidden="true"
              />
              <span className="db-label">
                {data.endpoint || 'Endpoint not configured'}
              </span>
              <span className={`db-value ${data.latency_ms < 10 ? 'db-value--fast' : data.latency_ms > 100 ? 'db-value--slow' : ''}`}>
                {isOk ? `${data.latency_ms} ms` : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: '0.5rem' }}>
              {[
                { key: 'Region',      val: data.region },
                { key: 'Status',      val: data.db,        ok: isOk },
                { key: 'App version', val: data.version },
                { key: 'Checked at',  val: new Date(data.timestamp).toLocaleTimeString() },
              ].map(({ key, val, ok }) => (
                <div key={key} className="dr-detail-row">
                  <span className="dr-detail-key">{key}</span>
                  <span className={`dr-detail-val${ok ? ' dr-detail-val--ok' : ''}`}>{val}</span>
                </div>
              ))}
            </div>

            {!isOk && (
              <p style={{
                fontFamily: 'var(--mono)',
                fontSize: '0.65rem',
                color: 'var(--danger)',
                marginTop: '0.5rem',
                lineHeight: 1.5,
              }}>
                No DATABASE_URL configured — set it to point to the primary RDS endpoint
                (or the DR endpoint after failover).
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
