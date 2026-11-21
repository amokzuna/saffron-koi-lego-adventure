import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  error: Error | null;
}

/** Catches unexpected rendering/game-start errors and offers a way back instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset();
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen">
        <div className="panel" role="alert">
          <h1 className="panel-title">Something went wrong</h1>
          <p>The game hit an unexpected problem. Your browser may not support the required graphics features, or a temporary error occurred.</p>
          <div className="button-column">
            <button className="btn btn-primary" onClick={this.reset} autoFocus>
              Back to Main Menu
            </button>
          </div>
        </div>
      </main>
    );
  }
}
