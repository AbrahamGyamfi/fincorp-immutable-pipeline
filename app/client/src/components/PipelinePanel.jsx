import { usePolling } from '../hooks/usePolling'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function ScanSummary({ scan }) {
  const clean = scan.CRITICAL === 0 && scan.HIGH === 0 && scan.MEDIUM === 0 && scan.LOW === 0
  if (clean) return <span className="scan-chip scan-chip--clean">✓ clean</span>
  return (
    <span className="build-scans">
      {scan.CRITICAL > 0 && <span className="scan-chip scan-chip--c">C:{scan.CRITICAL}</span>}
      {scan.HIGH > 0     && <span className="scan-chip scan-chip--h">H:{scan.HIGH}</span>}
      {scan.MEDIUM > 0   && <span className="scan-chip scan-chip--m">M:{scan.MEDIUM}</span>}
      {scan.LOW > 0      && <span className="scan-chip scan-chip--l">L:{scan.LOW}</span>}
    </span>
  )
}

export default function PipelinePanel() {
  const { data, error, loading } = usePolling('/api/pipeline')

  // Cosign attaches signature and attestation objects to ECR — they appear as
  // separate image entries. Filter them: real builds have 40-char git SHAs.
  const builds = data
    ? data.filter(b => /^[0-9a-f]{40}$/.test(b.sha))
    : []

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Artifact Pipeline</span>
        <span className="badge badge--info">ECR · eu-west-1</span>
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Fetching builds…</p>}
        {error   && <p className="state-msg state-msg--error">{error}</p>}

        {builds.length > 0 && (
          <div className="build-list">
            {builds.map(build => (
              <div
                key={build.sha}
                className={`build-row${build.stable ? ' build-row--stable' : ''}`}
              >
                <span className={`build-sha${build.stable ? ' build-sha--stable' : ''}`}>
                  {build.sha.slice(0, 8)}
                </span>

                <span className="build-meta">
                  <span className={`badge badge--${build.status === 'promoted' ? 'pass' : 'blocked'}`}>
                    {build.status}
                  </span>
                  {build.stable && (
                    <span className="badge badge--stable">:stable</span>
                  )}
                </span>

                <span className="build-scans">
                  <ScanSummary scan={build.scan} />
                </span>

                {build.size_mb > 0 && (
                  <span className="build-size">{build.size_mb} MB</span>
                )}

                <span className="build-time">{timeAgo(build.pushed_at)}</span>
              </div>
            ))}
          </div>
        )}

        {!loading && builds.length === 0 && !error && (
          <p className="state-msg">No builds pushed yet.</p>
        )}
      </div>
    </section>
  )
}
