import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Check if we're in development mode and should bypass authentication
  const isDevelopment = import.meta.env.DEV || 
                       import.meta.env.VITE_DEBUG_MODE === 'true' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1'

  // In development mode, bypass authentication for testing
  if (isDevelopment) {
    console.log('Development mode: Bypassing authentication for testing')
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
