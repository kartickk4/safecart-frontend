import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Instant canonical redirect: automatically forward visitors from onrender to securekaro.in
if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && window.location.hostname.includes('frontend')) {
  window.location.replace(`https://securekaro.in${window.location.pathname}${window.location.search}${window.location.hash}`);
}

// Automatically recover from stale Vite chunk hashes across deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event?.preventDefault?.();
    console.warn('[SecureKaro] Stale deployment asset detected, auto-reloading page with cache-bust...');
    const now = Date.now();
    const cleanUrl = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_v=' + now;
    window.location.replace(cleanUrl);
  });
}

const GlobalFallback = () => (
  <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6 text-center select-none">
    <div className="w-10 h-10 border-[3px] border-blue-100 border-t-[#1E56E3] rounded-full animate-spin shadow-xs" />
    <span className="text-xs font-bold text-slate-500 tracking-wide mt-3">Loading SecureKaro...</span>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<GlobalFallback />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
