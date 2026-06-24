import { usePolling } from '../hooks/usePolling'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

const C = {
  label: { fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#64748B' },
  sub:   { fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' },
  key:   { fontSize: '0.78rem', fontWeight: 500, color: '#334155' },
  val:   { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#0F172A' },
  valOk: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#059669', fontWeight: 500 },
  mono:  { fontFamily: "'JetBrains Mono', monospace" },
}

function StatCard({ label, value, sub, status }) {
  const colorMap = { ok: '#059669', warn: '#D97706', error: '#DC2626', dim: '#94A3B8' }
  const col = colorMap[status] ?? '#0F172A'
  return (
    <div style={{
      background: '#F1F5F9', border: '1px solid #CBD5E1',
      borderRadius: '14px', padding: '1.2rem 1.35rem',
    }}>
      <div style={{
        ...C.mono,
        fontSize: '1.65rem', fontWeight: 600,
        lineHeight: 1, letterSpacing: '-0.03em',
        color: col, marginBottom: '0.4rem',
      }}>{value}</div>
      <div style={C.label}>{label}</div>
      {sub && <div style={C.sub}>{sub}</div>}
    </div>
  )
}

export default function OverviewPanel() {
  const health   = usePolling('/api/health',   15_000)
  const pipeline = usePolling('/api/pipeline', 30_000)
  const security = usePolling('/api/security', 30_000)
  const dr       = usePolling('/api/dr',       30_000)

  const builds = pipeline.data
    ? pipeline.data.filter(b => /^[0-9a-f]{40}$/.test(b.sha))
    : []
  const stable   = builds.find(b => b.stable)
  const gatePass = security.data?.gate_status === 'PASSED'
  const dbOk     = health.data?.db === 'connected'
  const backup   = dr.data?.last_backup

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Overview</span>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
          All systems · eu-west-1
        </span>
      </div>

      <div className="panel-body" style={{ maxWidth: '100%' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.85rem' }}>
          <StatCard
            label="Pipeline"
            value={stable ? stable.sha.slice(0, 8) : '—'}
            sub={stable ? `promoted ${timeAgo(stable.pushed_at)}` : 'no stable image'}
            status={stable ? 'ok' : 'dim'}
          />
          <StatCard
            label="Security gate"
            value={security.data ? (gatePass ? 'Passed' : 'Blocked') : '—'}
            sub={security.data ? `C:${security.data.counts?.CRITICAL ?? 0}  H:${security.data.counts?.HIGH ?? 0}` : 'loading'}
            status={security.data ? (gatePass ? 'ok' : 'error') : 'dim'}
          />
          <StatCard
            label="Database"
            value={health.data ? (dbOk ? `${health.data.latency_ms} ms` : 'Error') : '—'}
            sub={health.data ? (dbOk ? 'connected' : health.data.error?.slice(0, 32)) : 'loading'}
            status={health.data ? (dbOk ? 'ok' : 'error') : 'dim'}
          />
          <StatCard
            label="Last backup"
            value={backup ? backup.status : '—'}
            sub={backup ? timeAgo(backup.completed_at) : 'no backup yet'}
            status={backup ? 'ok' : 'dim'}
          />
        </div>

        {/* Recent builds */}
        <div style={{ marginBottom: '1.6rem' }}>
          <div style={{ ...C.label, marginBottom: '0.85rem' }}>Recent builds</div>
          {builds.length === 0 && (
            <p className="state-msg" style={{ padding: '1rem 0', textAlign: 'left' }}>No builds yet.</p>
          )}
          {builds.slice(0, 5).map(b => (
            <div key={b.sha} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              borderBottom: b.stable ? 'none' : '1px solid #CBD5E1',
              background: b.stable ? '#FFFBEB' : 'transparent',
              borderRadius: b.stable ? '9px' : 0,
              border: b.stable ? '1px solid rgba(217,119,6,.20)' : undefined,
              padding: b.stable ? '0.85rem 1rem' : '0.85rem 0',
              margin: b.stable ? '0.3rem -1rem' : 0,
            }}>
              <span style={{ ...C.mono, fontSize: '0.875rem', fontWeight: 500, color: b.stable ? '#D97706' : '#38BDF8', width: '8.5ch' }}>
                {b.sha.slice(0, 8)}
              </span>
              <span className={`badge badge--${b.status === 'promoted' ? 'pass' : 'blocked'}`}>{b.status}</span>
              {b.stable && <span className="badge badge--stable">:stable</span>}
              <span style={{ marginLeft: 'auto', ...C.mono, fontSize: '0.72rem', color: '#64748B' }}>{timeAgo(b.pushed_at)}</span>
            </div>
          ))}
        </div>

        {/* DB + DR info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
            <div style={{ ...C.label, marginBottom: '0.75rem' }}>Database</div>
            {health.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>Status</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: dbOk ? '#059669' : '#DC2626' }}>{health.data.db}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>Region</span>
                  <span style={C.val}>{health.data.region}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>Latency</span>
                  <span style={dbOk ? C.valOk : C.val}>{dbOk ? `${health.data.latency_ms} ms` : '—'}</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
            <div style={{ ...C.label, marginBottom: '0.75rem' }}>Disaster Recovery</div>
            {dr.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>RTO target</span>
                  <span style={C.val}>≤{dr.data.rto_minutes}m</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>RPO target</span>
                  <span style={C.val}>{dr.data.rpo_hours}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={C.key}>Mode</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: dr.data.dr_active ? '#DC2626' : '#059669' }}>
                    {dr.data.dr_active ? 'DR Active' : 'Standby'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
