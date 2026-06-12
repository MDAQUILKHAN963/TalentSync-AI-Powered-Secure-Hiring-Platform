import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

// In production, point all API calls at the deployed backend.
// In dev this stays empty and the Vite proxy handles /api and /uploads.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

