import { usePolling } from '../hooks/usePolling'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'just now'
}

export default function PipelinePanel() {
  const { data, error, loading } = usePolling('/api/pipeline')

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">Artifact Pipeline</span>
        <span className="badge badge--pending">ECR · us-east-1</span>
      </div>

      <div className="panel-body">
        {loading && <p className="state-msg">Fetching builds…</p>}
        {error   && <p className="state-msg state-msg--error">Error: {error}</p>}

        {data && data.map((build) => (
          <div key={build.sha} className="build-row">
            <span className="build-sha">{build.sha}</span>

            <span className={`badge badge--${build.status === 'promoted' ? 'pass' : 'blocked'}`}>
              {build.status}
            </span>

            {build.stable && (
              <span className="badge badge--stable">:stable</span>
            )}

            <div className="build-scan">
              {build.scan.CRITICAL > 0 && (
                <span className="scan-chip scan-chip--danger">C:{build.scan.CRITICAL}</span>
              )}
              {build.scan.HIGH > 0 && (
                <span className="scan-chip scan-chip--danger">H:{build.scan.HIGH}</span>
              )}
              <span className="scan-chip">M:{build.scan.MEDIUM}</span>
              <span className="scan-chip">L:{build.scan.LOW}</span>
            </div>

            <span className="build-time">{timeAgo(build.pushed_at)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
