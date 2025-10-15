import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  getGoogleRedirectResult,
  AuthenticationError,
  refreshFirebaseToken,
  isUserAuthenticated,
  initializeAuthPersistence
} from '../services/firebase'
import { authAPI } from '../services/api'
import { User, AuthState } from '../types'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  checkAuthState: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Handle redirect result on app initialization (only if user came from redirect)
  useEffect(() => {
    const handleRedirectResult = async () => {
      console.log('=== App initialization - checking auth state ===')
      
      // Initialize auth persistence first
      console.log('Initializing Firebase auth persistence...')
      await initializeAuthPersistence()
      
      console.log('Current Firebase user:', auth.currentUser ? 'Present' : 'Null')
      console.log('Local storage token:', localStorage.getItem('idToken') ? 'Present' : 'Missing')
      
      // Only check for redirect result if we're in a redirect flow
      const urlParams = new URLSearchParams(window.location.search)
      const isRedirectFlow = urlParams.has('code') || urlParams.has('state') || 
                           window.location.pathname.includes('auth') ||
                           document.referrer.includes('accounts.google.com')
      
      console.log('Redirect flow detected:', isRedirectFlow)
      console.log('URL params:', Object.fromEntries(urlParams.entries()))
      console.log('Current path:', window.location.pathname)
      console.log('Document referrer:', document.referrer)
      
      if (!isRedirectFlow) {
        console.log('Not a redirect flow - skipping redirect result check')
        
        // Check if user is already authenticated
        if (isUserAuthenticated()) {
          console.log('User appears to be authenticated, refreshing token...')
          const refreshedToken = await refreshFirebaseToken()
          if (refreshedToken) {
            localStorage.setItem('idToken', refreshedToken)
            console.log('Token refreshed, user should remain authenticated')
          }
        } else {
          console.log('No existing authentication found')
        }
        
        setIsLoading(false)
        return
      }

      try {
        console.log('Checking for redirect result (redirect flow detected)...')
        const redirectUser = await getGoogleRedirectResult()
        if (redirectUser) {
          console.log('Processing redirect result...')
          await processUserAuthentication(redirectUser)
        } else {
          console.log('No redirect result found')
        }
      } catch (error) {
        console.error('Error processing redirect result:', error)
        if (error instanceof AuthenticationError) {
          toast.error(error.message)
        }
      } finally {
        // Ensure loading state is cleared even if redirect check fails
        setIsLoading(false)
      }
    }

    handleRedirectResult()
  }, [])

  const processUserAuthentication = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      
      // Store token
      localStorage.setItem('idToken', idToken)
      
      // Try to get user data first, if not found, register them
      try {
        console.log('Attempting to get current user...')
        const response = await authAPI.getCurrentUser()
        console.log('User found:', response.user)
        setUser(response.user)
        setIsAuthenticated(true)
      } catch (error) {
        console.log('User not found, attempting to register...', error)
        try {
          const registerResponse = await authAPI.register(idToken)
          console.log('User registered successfully:', registerResponse.user)
          setUser(registerResponse.user)
          setIsAuthenticated(true)
        } catch (registerError) {
          console.error('Registration failed:', registerError)
          const errorMessage = registerError instanceof Error ? registerError.message : 'Unknown registration error'
          throw new Error('Failed to register user: ' + errorMessage)
        }
      }
      
      toast.success('Successfully signed in!')
    } catch (error) {
      console.error('Error processing user authentication:', error)
      throw error
    }
  }

  const signIn = async () => {
    try {
      console.log('=== Starting sign-in process ===')
      setIsLoading(true)
      
      console.log('Calling signInWithGoogle...')
      const firebaseUser = await signInWithGoogle()
      console.log('Firebase user received:', firebaseUser ? 'User object received' : 'No user object')
      
      if (firebaseUser) {
        console.log('User details:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        })
        
        console.log('Processing user authentication...')
        await processUserAuthentication(firebaseUser)
        console.log('=== Sign-in process completed successfully ===')
      } else {
        console.error('No Firebase user received from signInWithGoogle')
        throw new Error('No user received from authentication')
      }
    } catch (error) {
      console.error('=== Sign-in process failed ===')
      console.error('Sign in error:', error)
      
      // Handle different types of errors
      if (error instanceof AuthenticationError) {
        // Handle redirect in progress
        if (error.code === 'redirect-in-progress') {
          toast('Redirecting to sign-in page...', { icon: 'ℹ️' })
          return // Don't show error for redirect
        }
        
        // Show user-friendly error message
        toast.error(error.message)
      } else {
        // Handle other errors
        let errorMessage = 'Failed to sign in'
        const errorString = error instanceof Error ? error.message : String(error)
        
        if (errorString.includes('Failed to register user')) {
          errorMessage = 'Failed to create user account'
        } else if (errorString.includes('404')) {
          errorMessage = 'Server connection failed. Please check your internet connection.'
        } else if (errorString.includes('Network Error')) {
          errorMessage = 'Network error. Please try again.'
        }
        
        toast.error(errorMessage)
      }
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await signOutUser()
      localStorage.removeItem('idToken')
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Successfully signed out!')
    } catch (error) {
      console.error('Sign out error:', error)
      
      if (error instanceof AuthenticationError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to sign out')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      console.log('=== Refreshing user data ===')
      const response = await authAPI.getCurrentUser()
      setUser(response.user)
      setIsAuthenticated(true)
      console.log('User data refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const checkAuthState = () => {
    console.log('=== Manual auth state check ===')
    console.log('Current Firebase user:', auth.currentUser ? 'Present' : 'Null')
    console.log('Local storage token:', localStorage.getItem('idToken') ? 'Present' : 'Missing')
    console.log('React state - user:', user)
    console.log('React state - isAuthenticated:', isAuthenticated)
    console.log('React state - isLoading:', isLoading)
  }

  // Set up periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      console.log('Periodic token refresh check...')
      const refreshedToken = await refreshFirebaseToken()
      if (refreshedToken) {
        localStorage.setItem('idToken', refreshedToken)
        console.log('Token refreshed successfully')
      } else {
        console.log('Token refresh failed - user may need to re-authenticate')
      }
    }, 50 * 60 * 1000) // Refresh every 50 minutes (tokens expire after 1 hour)

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated])

  useEffect(() => {
    // Delay setting up the auth state listener to ensure persistence is established
    const setupAuthListener = async () => {
      console.log('Setting up Firebase auth state listener...')
      
      // Wait a bit for persistence to be fully established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        console.log('=== Firebase auth state changed ===')
        console.log('Firebase user:', firebaseUser ? 'Present' : 'Null')
        console.log('Current timestamp:', new Date().toISOString())
        
        if (firebaseUser) {
          console.log('User details from Firebase:', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime,
              lastSignInTime: firebaseUser.metadata.lastSignInTime
            }
          })
          
          try {
            console.log('Getting Firebase ID token...')
            const idToken = await firebaseUser.getIdToken()
            console.log('ID token received, length:', idToken.length)
            localStorage.setItem('idToken', idToken)
            
            console.log('Calling backend API to get user data...')
            const response = await authAPI.getCurrentUser()
            console.log('Backend user data received:', response.user)
            
            setUser(response.user)
            setIsAuthenticated(true)
            console.log('=== User authenticated successfully ===')
          } catch (error) {
            console.error('=== Failed to get user data from backend ===')
            console.error('Error details:', error)
            
            // Try to refresh token and retry
            console.log('Attempting to refresh token and retry...')
            try {
              const refreshedToken = await refreshFirebaseToken()
              if (refreshedToken) {
                localStorage.setItem('idToken', refreshedToken)
                console.log('Token refreshed, retrying API call...')
                const retryResponse = await authAPI.getCurrentUser()
                setUser(retryResponse.user)
                setIsAuthenticated(true)
                console.log('=== User authenticated successfully after retry ===')
                return
              }
            } catch (retryError) {
              console.error('Retry also failed:', retryError)
            }
            
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          console.log('No Firebase user - clearing auth state')
          console.log('Auth state change reason: Firebase user became null')
          console.log('Current auth state before clearing:', {
            hasLocalToken: !!localStorage.getItem('idToken'),
            reactUser: user,
            reactAuthenticated: isAuthenticated
          })
          
          localStorage.removeItem('idToken')
          setUser(null)
          setIsAuthenticated(false)
          console.log('=== User signed out ===')
        }
        setIsLoading(false)
      })

      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined

    setupAuthListener().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    refreshUser,
    checkAuthState,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
