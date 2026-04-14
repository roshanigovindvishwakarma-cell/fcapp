import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import ErrorBoundary from './components/ErrorBoundary'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://atrium-chat-backend.onrender.com').replace(/\/$/, '');
axios.defaults.baseURL = BACKEND_URL;

console.log(`[App] Using Backend URL: ${BACKEND_URL}`);
console.log(`[App] Environment: ${import.meta.env.MODE}`);

// Add interceptor to handle token expiration/auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
