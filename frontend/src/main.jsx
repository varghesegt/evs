import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Invalidate stale client caches to reflect live 80+ Trichy node network immediately
try {
  const cached = localStorage.getItem('ecoshare_cache_/analytics/map-pins');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed) || parsed.length < 50) {
      localStorage.removeItem('ecoshare_cache_/analytics/map-pins');
      localStorage.removeItem('ecoshare_cache_/analytics/public/map-pins');
    }
  }
} catch {}

// Register Service Worker for offline PWA functionality & ensure immediate updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then((reg) => {
        reg.update().catch(() => {});
        console.info('[PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
