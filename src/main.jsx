import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Hide the inline loading screen once React has painted */
const loader = document.getElementById('app-loading')
if (loader) {
  loader.classList.add('hidden')
  setTimeout(() => loader.remove(), 350)
}
