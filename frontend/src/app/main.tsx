import { createRoot } from 'react-dom/client'
import { App } from './providers'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <App />,
)
