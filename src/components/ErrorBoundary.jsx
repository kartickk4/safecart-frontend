import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('SecureKaro Uncaught Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
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
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all active:scale-95"
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
