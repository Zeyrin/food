import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import LimiteErreur from './components/LimiteErreur'
import { FournisseurLangue } from './lib/i18n'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Au-dessus du fournisseur de langue : le filet doit tenir même si
        c'est lui qui échoue. */}
    <LimiteErreur>
      <FournisseurLangue>
        <App />
      </FournisseurLangue>
    </LimiteErreur>
    <Analytics />
  </StrictMode>,
)
