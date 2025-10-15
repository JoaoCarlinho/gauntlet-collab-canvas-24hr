import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  getGoogleRedirectResult,
  AuthenticationError 
} from '../services/firebase'
import { authAPI } from '../services/api'
import { User, AuthState } from '../types'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
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

  // Handle redirect result on app initialization
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const redirectUser = await getGoogleRedirectResult()
        if (redirectUser) {
          console.log('Processing redirect result...')
          await processUserAuthentication(redirectUser)
        }
      } catch (error) {
        console.error('Error processing redirect result:', error)
        if (error instanceof AuthenticationError) {
          toast.error(error.message)
        }
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
      setIsLoading(true)
      const firebaseUser = await signInWithGoogle()
      await processUserAuthentication(firebaseUser)
    } catch (error) {
      console.error('Sign in error:', error)
      
      // Handle different types of errors
      if (error instanceof AuthenticationError) {
        // Handle redirect in progress
        if (error.code === 'redirect-in-progress') {
          toast.info('Redirecting to sign-in page...')
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
      const response = await authAPI.getCurrentUser()
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          localStorage.setItem('idToken', idToken)
          
          // Get user data from backend
          const response = await authAPI.getCurrentUser()
          setUser(response.user)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Failed to get user data:', error)
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        localStorage.removeItem('idToken')
        setUser(null)
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
