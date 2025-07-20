import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Performance monitoring - capture 100% of transactions
  tracesSampleRate: 1.0,

  // Session Replay 설정
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 환경 설정
  environment: "development",
});

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
