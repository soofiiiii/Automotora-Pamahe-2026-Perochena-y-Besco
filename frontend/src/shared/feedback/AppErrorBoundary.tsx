import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("UI error", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <div className="state-card">
            <strong>La aplicación encontró un error inesperado.</strong>
            <p>Recargá la página. Si el problema continúa, informalo al responsable del sistema.</p>
            <button className="button" type="button" onClick={() => window.location.reload()}>
              Recargar aplicación
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
