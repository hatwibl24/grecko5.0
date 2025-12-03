import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global PayPal Configuration (LIVE)
const initialOptions = {
    // 👇 LIVE Client ID
    "clientId": "ATNc9BiWfYBCaZkYVeQSvA0vUMEk-0GHzeEO8mRsS0zOQV17hyoVqJDC2FHvfwOrliy6VHR8djR2kfYt",
    "currency": "USD",
    "intent": "capture",
    // We removed 'components' and 'disable-funding' temporarily to prevent 400 errors 
    // If you need them, add them back carefully later.
};

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        {/* We wrap the App in PayPal provider so it's available everywhere */}
        <PayPalScriptProvider options={initialOptions}>
          <App />
        </PayPalScriptProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('[Grecko] PWA ready'))
      .catch((err) => console.log('[Grecko] SW failed:', err));
  });
}