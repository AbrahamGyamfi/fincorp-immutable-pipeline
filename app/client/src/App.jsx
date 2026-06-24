import { useState, useEffect } from 'react'
import ErrorBoundary    from './ErrorBoundary'
import OverviewPanel    from './components/OverviewPanel'
import PipelinePanel    from './components/PipelinePanel'
import SecurityPanel    from './components/SecurityPanel'
import DbPanel          from './components/DbPanel'
import DrPanel          from './components/DrPanel'

const TABS = [
  { id: 'overview',  label: 'Dashboard', icon: '▣', component: OverviewPanel  },
  { id: 'pipeline',  label: 'Pipeline',  icon: '⬡', component: PipelinePanel  },
  { id: 'security',  label: 'Security',  icon: '◈', component: SecurityPanel  },
  { id: 'database',  label: 'Database',  icon: '◎', component: DbPanel        },
  { id: 'dr',        label: 'Recovery',  icon: '◆', component: DrPanel        },
]

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export default function App() {
  const now     = useClock()
  const [active, setActive] = useState('overview')
  const current = TABS.find(t => t.id === active)
  const Panel   = current.component

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">Fin<em>Corp</em></span>
          <div className="header-divider" aria-hidden="true" />
          <span className="header-subtitle">Pipeline Control Center</span>
        </div>
        <div className="header-right">
          <div className="live-badge">
            <span className="live-dot" aria-hidden="true" />
            Live
          </div>
          <span className="header-clock" aria-live="polite">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Navigation">
          <div className="sidebar-label">Menu</div>
          <nav>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-item${active === tab.id ? ' nav-item--active' : ''}`}
                onClick={() => setActive(tab.id)}
                aria-current={active === tab.id ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="sidebar-region">eu-west-1</span>
          </div>
        </aside>

        <div className="content-wrap">
          <div className="content-card" role="main">
            <ErrorBoundary title={current.label}>
              <Panel />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}
