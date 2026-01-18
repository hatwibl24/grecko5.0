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

// Global PayPal Configuration (UPDATED WITH NEW LIVE ID)
const initialOptions = {
    "clientId": "AaujLBv8lMdwL39whBR3fTqoAmQasgBJuUEenc9sOH5PfA1XAehif-IMqPWMllk5YBxlPc4z7sKcw_EV",
    "currency": "USD",
    "intent": "capture",
};

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        {/* The provider now uses your verified new account ID */}
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
