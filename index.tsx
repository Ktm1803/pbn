if (typeof window !== 'undefined') {
  try {
    if (!(window as any).global) {
      (window as any).global = window;
    }
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let _fetch = origFetch;
    Object.defineProperty(window, 'fetch', {
      get: () => _fetch,
      set: (val) => { if (typeof val === 'function') _fetch = val; },
      configurable: true,
      enumerable: true
    });
  } catch (e) {}
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);