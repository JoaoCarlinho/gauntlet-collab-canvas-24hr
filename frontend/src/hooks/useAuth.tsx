import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth, signInWithGoogle, signOutUser } from '../services/firebase'
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

  const signIn = async () => {
    try {
      setIsLoading(true)
      const firebaseUser = await signInWithGoogle()
      const idToken = await firebaseUser.getIdToken()
      
      // Store token
      localStorage.setItem('idToken', idToken)
      
      // Try to get user data first, if not found, register them
      try {
        const response = await authAPI.getCurrentUser()
        setUser(response.user)
        setIsAuthenticated(true)
      } catch (error) {
        // If user doesn't exist, register them
        console.log('User not found, registering...')
        const registerResponse = await authAPI.register(idToken)
        setUser(registerResponse.user)
        setIsAuthenticated(true)
      }
      
      toast.success('Successfully signed in!')
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Failed to sign in')
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
      toast.error('Failed to sign out')
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
