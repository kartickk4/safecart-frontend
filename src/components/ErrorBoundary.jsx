import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, Sparkles } from 'lucide-react';

function checkIsChunkLoadError(error) {
  if (!error) return false;
  const msg = error.message || error.toString() || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    error.name === 'ChunkLoadError' ||
    (error instanceof SyntaxError && msg.includes("Unexpected token '<'"))
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isChunkLoadError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkLoad = checkIsChunkLoadError(error);
    return { hasError: true, error, isChunkLoadError: isChunkLoad };
  }

  componentDidCatch(error, errorInfo) {
    const isChunkLoad = checkIsChunkLoadError(error);
    this.setState({ errorInfo, isChunkLoadError: isChunkLoad });
    console.error('SecureKaro Uncaught Application Error:', error, errorInfo);

    // If this error is due to a stale code chunk after a new release deployment, automatically reload once
    if (isChunkLoad && typeof window !== 'undefined') {
      const alreadyReloaded = sessionStorage.getItem('securekaro_eb_chunk_reloaded');
      if (!alreadyReloaded) {
        sessionStorage.setItem('securekaro_eb_chunk_reloaded', 'true');
        setTimeout(() => {
          const now = Date.now();
          window.location.replace(window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_v=' + now);
        }, 300);
      }
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('securekaro_eb_chunk_reloaded');
      const now = Date.now();
      window.location.replace(window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_v=' + now);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkLoadError: false });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('securekaro_eb_chunk_reloaded');
      const now = Date.now();
      window.location.replace('/?_v=' + now);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoadError) {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-[#1E56E3] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  New Update Available
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  A fresh version of SecureKaro was just deployed with the latest improvements. Tap below to reload and access your view.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1E56E3] hover:bg-[#1649CC] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload &amp; Update App</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Application Error
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We encountered an unexpected problem while rendering this view. Your account and data remain completely secure.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Back to Safety
              </button>
            </div>

            {this.state.error && (
              <details open className="mt-4 text-left bg-slate-100 rounded-xl p-3 text-xs text-slate-700 font-mono overflow-auto max-h-48 border border-slate-200">
                <summary className="cursor-pointer font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                  Diagnostic Details
                </summary>
                <p className="mt-2 text-red-600 font-semibold">{this.state.error.toString()}</p>
                <pre className="mt-1 text-[11px] whitespace-pre-wrap text-slate-500">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
