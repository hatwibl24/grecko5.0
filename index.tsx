import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global PayPal Configuration
const initialOptions = {
    "clientId": "ATNc9BiWfYBCaZkYVeQSvA0vUMEk-0GHzeEO8mRsS0zOQV17hyoVqJDC2FHvfwOrliy6VHR8djR2kfYt",
    "currency": "USD",
    "intent": "capture",
    "components": "buttons",
    "disable-funding": "paylater,venmo,card,credit",
    "data-sdk-integration-source": "react-paypal-js"
};

root.render(
  <AuthProvider>
    <ToastProvider>
      <PayPalScriptProvider options={initialOptions}>
        <App />
      </PayPalScriptProvider>
    </ToastProvider>
  </AuthProvider>
);