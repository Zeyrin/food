import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import { FournisseurLangue } from './lib/i18n'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FournisseurLangue>
      <App />
    </FournisseurLangue>
    <Analytics />
  </StrictMode>,
)
