import { usePolling } from '../hooks/usePolling'

function hoursAgo(isoString) {
  const h = (Date.now() - new Date(isoString).getTime()) / 3_600_000
  return h < 1 ? `${Math.round(h * 60)}m ago` : `${h.toFixed(1)}h ago`
}

export default function DrPanel() {
  const { data, error, loading } = usePolling('/api/dr')

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Disaster Recovery</span>
        {data && (
          <span className={`badge badge--${data.dr_active ? 'blocked' : 'pass'}`}>
            {data.dr_active ? 'DR ACTIVE' : 'Standby'}
          </span>
        )}
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Fetching DR status…</p>}
        {error   && <p className="state-msg state-msg--error">Error: {error}</p>}

        {data && (
          <>
            <div className="dr-kpi-row">
              <div className="dr-kpi">
                <span className="dr-kpi-value">≤{data.rto_minutes}m</span>
                <span className="dr-kpi-label">RTO target</span>
              </div>
              <div className="dr-kpi">
                <span className="dr-kpi-value">{data.rpo_hours}h</span>
                <span className="dr-kpi-label">RPO target</span>
              </div>
              <div className="dr-kpi">
                <span className="dr-kpi-value" style={{ color: 'var(--green)', fontSize: '1rem' }}>
                  {data.last_backup?.status ?? '—'}
                </span>
                <span className="dr-kpi-label">Last backup</span>
              </div>
            </div>

            <div style={{ marginTop: '0.25rem' }}>
              {[
                { key: 'Primary DB',      val: `${data.primary.identifier} · ${data.primary.status}`, ok: data.primary.status === 'available' },
                { key: 'Primary region',  val: `${data.primary.region} · Multi-AZ: ${data.primary.multi_az}` },
                { key: 'Backup vault',    val: data.last_backup?.vault ?? '—' },
                { key: 'Backed up',       val: data.last_backup?.completed_at ? hoursAgo(data.last_backup.completed_at) : 'No backup yet', ok: !!data.last_backup },
                { key: 'Backup size',     val: data.last_backup ? `${data.last_backup.size_gb} GB` : '—' },
                { key: 'DR recovery pt',  val: data.recovery_point?.region ?? 'Pending', ok: !!data.recovery_point },
                { key: 'DR copy age',     val: data.recovery_point ? `${data.recovery_point.age_hours.toFixed(1)}h` : '—', ok: data.recovery_point && data.recovery_point.age_hours < data.rpo_hours },
              ].map(({ key, val, ok }) => (
                <div key={key} className="dr-detail-row">
                  <span className="dr-detail-key">{key}</span>
                  <span className={`dr-detail-val${ok ? ' dr-detail-val--ok' : ''}`}>{val}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
