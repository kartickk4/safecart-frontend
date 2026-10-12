import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Instant canonical redirect: automatically forward visitors from onrender to securekaro.in
if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && window.location.hostname.includes('frontend')) {
  window.location.replace(`https://securekaro.in${window.location.pathname}${window.location.search}${window.location.hash}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
