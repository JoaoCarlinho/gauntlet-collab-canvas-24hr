import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

// Filter out external service errors from console
const originalError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  // Filter out common external service errors
  if (
    message.includes('/api/jwt') ||
    message.includes('chrome-extension') ||
    message.includes('moz-extension') ||
    message.includes('Failed to load resource: the server responded with a status of 403')
  ) {
    // Log at debug level instead
    console.debug('External service error (filtered):', ...args)
    return
  }
  originalError.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>,
)
