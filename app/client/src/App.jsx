import { useState, useEffect } from 'react'
import PipelinePanel from './components/PipelinePanel'
import SecurityPanel from './components/SecurityPanel'
import DbPanel       from './components/DbPanel'
import DrPanel       from './components/DrPanel'

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export default function App() {
  const now = useNow()

  return (
    <div className="app">
      <div className="seal-bar" aria-hidden="true" />

      <header className="header">
        <div className="header-brand">
          <span className="header-logo">
            Fin<span>Corp</span>
          </span>
          <div className="header-divider" aria-hidden="true" />
          <span className="header-subtitle">Pipeline Control Center</span>
        </div>

        <div className="header-right">
          <span className="refresh-time">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <div className="live-indicator">
            <span className="live-dot" aria-hidden="true" />
            Live · 30 s
          </div>
        </div>
      </header>

      <main className="dashboard">
        <PipelinePanel />
        <SecurityPanel />
        <DbPanel />
        <DrPanel />
      </main>
    </div>
  )
}
