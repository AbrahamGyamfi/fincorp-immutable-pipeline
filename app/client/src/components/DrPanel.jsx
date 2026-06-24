import { usePolling } from '../hooks/usePolling'

function hoursAgo(isoString) {
  if (!isoString) return '—'
  const h = (Date.now() - new Date(isoString).getTime()) / 3_600_000
  return h < 1
    ? `${Math.round(h * 60)}m ago`
    : `${h.toFixed(1)}h ago`
}

export default function DrPanel() {
  const { data, error, loading } = usePolling('/api/dr')

  const backup = data?.last_backup   ?? null
  const rp     = data?.recovery_point ?? null

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Disaster Recovery</span>
        {data && (
          <span className={`badge badge--${data.dr_active ? 'blocked' : 'pass'}`}>
            {data.dr_active ? 'DR Active' : 'Standby'}
          </span>
        )}
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Fetching DR status…</p>}
        {error   && <p className="state-msg state-msg--error">{error}</p>}

        {data && (
          <>
            <div className="dr-kpi-row">
              <div className="dr-kpi">
                <div className="dr-kpi-value">≤{data.rto_minutes}m</div>
                <div className="dr-kpi-label">RTO target</div>
              </div>
              <div className="dr-kpi">
                <div className="dr-kpi-value">{data.rpo_hours}h</div>
                <div className="dr-kpi-label">RPO target</div>
              </div>
              <div className="dr-kpi">
                <div className={`dr-kpi-value${backup ? ' dr-kpi-value--ok' : ' dr-kpi-value--none'}`}>
                  {backup?.status ?? 'No backup'}
                </div>
                <div className="dr-kpi-label">Last backup</div>
              </div>
            </div>

            <div className="dr-table">
              {[
                {
                  key: 'Primary DB',
                  val: data.primary
                    ? `${data.primary.identifier} · ${data.primary.status}`
                    : '—',
                  ok: data.primary?.status === 'available',
                },
                {
                  key: 'Region',
                  val: data.primary
                    ? `${data.primary.region} · Multi-AZ: ${data.primary.multi_az}`
                    : '—',
                },
                {
                  key: 'Backup vault',
                  val: backup?.vault ?? '—',
                  none: !backup,
                },
                {
                  key: 'Backed up',
                  val: backup ? hoursAgo(backup.completed_at) : 'No backup yet',
                  ok: !!backup,
                  none: !backup,
                },
                {
                  key: 'Backup size',
                  val: backup ? `${backup.size_gb} GB` : '—',
                  none: !backup,
                },
                {
                  key: 'DR copy',
                  val: rp ? rp.region : 'Pending',
                  ok: !!rp,
                  none: !rp,
                },
                {
                  key: 'Copy age',
                  val: rp ? `${rp.age_hours.toFixed(1)}h` : '—',
                  ok: rp && rp.age_hours < data.rpo_hours,
                  none: !rp,
                },
              ].map(({ key, val, ok, none }) => (
                <div key={key} className="dr-row">
                  <span className="dr-key">{key}</span>
                  <span className={`dr-val${ok ? ' dr-val--ok' : none ? ' dr-val--none' : ''}`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
