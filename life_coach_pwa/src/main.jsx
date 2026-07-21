import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.jsx'
import { isTestAuthActive, clearTestAuthSession } from './lib/testAuth'
import { useTestAuthForConvex } from './hooks/useTestAuthForConvex'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local')
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

/**
 * ClerkProvider always wraps the tree (so Clerk UI components never crash).
 * Convex auth switches: real Clerk JWT vs test-backdoor JWT.
 */
function ConvexBridge({ testMode, children }) {
  if (testMode) {
    return (
      <ConvexProviderWithAuth client={convex} useAuth={useTestAuthForConvex}>
        {children}
      </ConvexProviderWithAuth>
    )
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}

function Bootstrap() {
  const [testMode] = useState(() => isTestAuthActive())

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexBridge testMode={testMode}>
        <App authMode={testMode ? 'test' : 'clerk'} />
      </ConvexBridge>
    </ClerkProvider>
  )
}

if (typeof window !== 'undefined') {
  window.__vedicasExitTestAuth = () => {
    clearTestAuthSession()
    window.location.assign('/')
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
