import Hero from './components/Hero'
import PipelineSection from './components/PipelineSection'
import DrSection from './components/DrSection'
import ReferenceSection from './components/ReferenceSection'

export default function App() {
  return (
    <>
      <div className="seal-bar" aria-hidden="true" />
      <Hero />
      <PipelineSection />
      <DrSection />
      <ReferenceSection />
      <footer className="site-footer">
        <div className="wrap footer-inner">
          <span className="footer-id">FinCorp · Immutable &amp; Indestructible Pipeline</span>
          <span className="footer-id">
            artifact <span>fincorp-api:&lt;git-sha&gt;</span> · primary us-east-1 · dr us-west-2
          </span>
        </div>
      </footer>
    </>
  )
}
