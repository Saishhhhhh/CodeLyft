import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { initLogoService } from './services/logoService';

// Initialize the logo service
initLogoService().then(() => {
  console.log('Logo service initialized successfully');
}).catch(error => {
  console.error('Failed to initialize logo service:', error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
