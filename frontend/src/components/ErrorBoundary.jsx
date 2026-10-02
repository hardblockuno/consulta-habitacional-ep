import { AlertCircle, RefreshCw } from "lucide-react";
import React, { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary ha capturado un error no controlado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[340px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md rounded-xl border border-rose-200/80 bg-white p-6 shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-3">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {this.props.title || "Se produjo un problema al cargar esta vista"}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Ocurrió un error inesperado al procesar la información en pantalla. Puedes reintentar o recargar la plataforma.
            </p>

            {this.state.error?.message && (
              <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2.5 text-left font-mono text-[11px] text-slate-600 break-words overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
