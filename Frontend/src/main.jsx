import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/themes.css'
import App from './App.jsx'
import GoogleMapProvider from './components/GooglePlaces/GoogleMapProvider'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleMapProvider>
        <App />
      </GoogleMapProvider>
    </ThemeProvider>
  </StrictMode>,
)
