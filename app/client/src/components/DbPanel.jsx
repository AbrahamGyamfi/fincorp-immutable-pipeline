import { usePolling } from '../hooks/usePolling'

function latencyClass(ms) {
  if (ms === null || ms === undefined) return 'none'
  if (ms < 10)  return 'fast'
  if (ms < 100) return 'mid'
  return 'slow'
}

export default function DbPanel() {
  const { data, error, loading } = usePolling('/api/health', 10_000)

  const isOk   = data?.db === 'connected'
  const latency = isOk ? (data?.latency_ms ?? null) : null
  const lClass  = latencyClass(latency)

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
        {error   && <p className="state-msg state-msg--error">{error}</p>}

        {data && (
          <>
            <div className="db-hero">
              <div
                className={`db-indicator db-indicator--${isOk ? 'ok' : 'error'}`}
                aria-hidden="true"
              />

              <div className="db-latency">
                <div className="db-latency-number">
                  <span className={`db-latency-value db-latency-value--${lClass}`}>
                    {isOk && latency !== null ? latency : '—'}
                  </span>
                  {isOk && latency !== null && (
                    <span className="db-latency-unit">ms</span>
                  )}
                </div>
                <div className="db-latency-label">round-trip latency</div>
              </div>

              <span className={`db-status-word db-status-word--${isOk ? 'ok' : 'error'}`}>
                {isOk ? 'healthy' : 'error'}
              </span>
            </div>

            <div className="db-table">
              {[
                { key: 'Endpoint', val: data.endpoint || '—' },
                { key: 'Region',   val: data.region   || '—' },
                { key: 'Status',   val: data.db,        ok: isOk },
                { key: 'Version',  val: data.version  || '—' },
                { key: 'Checked',  val: new Date(data.timestamp).toLocaleTimeString() },
              ].map(({ key, val, ok }) => (
                <div key={key} className="db-row">
                  <span className="db-key">{key}</span>
                  <span className={`db-val${ok ? ' db-val--ok' : ''}`}>{val}</span>
                </div>
              ))}
            </div>

            {!isOk && data.error && (
              <p className="db-error-msg">{data.error}</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
