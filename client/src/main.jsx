import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered:', registration);
      }).catch(error => {
        console.log('SW registration failed:', error);
      });
    });
  } else {
    // In local dev, remove service workers/caches to avoid stale bundled code.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
