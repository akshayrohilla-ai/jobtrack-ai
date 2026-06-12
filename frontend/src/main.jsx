import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics'
import './index.css'

// Sentry error tracking — dormant unless VITE_SENTRY_DSN is set.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,        // 10% performance sampling — stays in free quota
    sendDefaultPii: false,        // don't attach user IP / personal data
    // Filter transient client-network noise (backgrounded tabs, flaky mobile
    // connections). These are retried automatically and aren't app bugs.
    ignoreErrors: [
      'AuthRetryableFetchError',
      'Load failed',
      'Failed to fetch',
      'Network request failed',
      'NetworkError',
    ],
  })
}

// PostHog analytics — dormant unless VITE_POSTHOG_KEY is set.
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
