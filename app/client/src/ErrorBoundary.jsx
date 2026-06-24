import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <section className="panel">
          <div className="panel-header">
            <span className="panel-title">{this.props.title ?? 'Panel'}</span>
            <span className="badge badge--blocked">Error</span>
          </div>
          <div className="panel-body">
            <p className="state-msg state-msg--error">
              {this.state.error.message}
            </p>
          </div>
        </section>
      )
    }
    return this.props.children
  }
}
