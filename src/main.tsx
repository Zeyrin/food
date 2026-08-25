import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FournisseurLangue } from './lib/i18n'
import LimiteErreur from './components/LimiteErreur'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FournisseurLangue>
      <LimiteErreur>
        <App />
      </LimiteErreur>
    </FournisseurLangue>
  </StrictMode>,
)
