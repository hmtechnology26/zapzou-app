import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-material-symbols/rounded'
import './index.css'
import App from './App'
import { AppProvider } from './hooks/useApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
