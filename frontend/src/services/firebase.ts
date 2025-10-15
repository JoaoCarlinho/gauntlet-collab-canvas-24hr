import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  AuthError,
  User
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
// Add additional scopes if needed
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Custom error types for better error handling
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: AuthError
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups and try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. Please contact support.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.'
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.'
    case 'auth/operation-not-allowed':
      return 'Sign-in method is not enabled. Please contact support.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.'
    default:
      return 'An unexpected error occurred during sign-in. Please try again.'
  }
}

export const signInWithGooglePopup = async (): Promise<User> => {
  try {
    console.log('Attempting Google sign-in with popup...')
    const result = await signInWithPopup(auth, googleProvider)
    console.log('Google sign-in successful via popup')
    return result.user
  } catch (error) {
    console.error('Popup sign-in failed:', error)
    
    if (error instanceof Error && 'code' in error) {
      const authError = error as AuthError
      const userMessage = getAuthErrorMessage(authError)
      throw new AuthenticationError(userMessage, authError.code, authError)
    }
    
    throw new AuthenticationError(
      'An unexpected error occurred during sign-in. Please try again.',
      'unknown',
      error as AuthError
    )
  }
}

export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    console.log('Attempting Google sign-in with redirect...')
    await signInWithRedirect(auth, googleProvider)
    // Note: This will redirect the user, so we won't reach the next line
  } catch (error) {
    console.error('Redirect sign-in failed:', error)
    
    if (error instanceof Error && 'code' in error) {
      const authError = error as AuthError
      const userMessage = getAuthErrorMessage(authError)
      throw new AuthenticationError(userMessage, authError.code, authError)
    }
    
    throw new AuthenticationError(
      'An unexpected error occurred during sign-in. Please try again.',
      'unknown',
      error as AuthError
    )
  }
}

export const getGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    console.log('Checking for redirect result...')
    const result = await getRedirectResult(auth)
    if (result) {
      console.log('Google sign-in successful via redirect')
      return result.user
    }
    return null
  } catch (error) {
    console.error('Error getting redirect result:', error)
    
    if (error instanceof Error && 'code' in error) {
      const authError = error as AuthError
      const userMessage = getAuthErrorMessage(authError)
      throw new AuthenticationError(userMessage, authError.code, authError)
    }
    
    throw new AuthenticationError(
      'An unexpected error occurred while processing sign-in. Please try again.',
      'unknown',
      error as AuthError
    )
  }
}

// Fallback authentication that tries popup first, then redirect
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // First try popup method
    return await signInWithGooglePopup()
  } catch (error) {
    console.log('Popup sign-in failed, trying redirect method...', error)
    
    // If popup fails due to blocking or user cancellation, try redirect
    if (error instanceof AuthenticationError) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithGoogleRedirect()
          // This will redirect, so we won't reach here
          throw new AuthenticationError(
            'Redirecting to sign-in page...',
            'redirect-in-progress'
          )
        } catch (redirectError) {
          // If redirect also fails, throw the original popup error
          throw error
        }
      }
    }
    
    // Re-throw the original error if it's not a popup-related issue
    throw error
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
    console.log('User signed out successfully')
  } catch (error) {
    console.error('Error signing out:', error)
    
    if (error instanceof Error && 'code' in error) {
      const authError = error as AuthError
      const userMessage = getAuthErrorMessage(authError)
      throw new AuthenticationError(userMessage, authError.code, authError)
    }
    
    throw new AuthenticationError(
      'An unexpected error occurred during sign-out. Please try again.',
      'unknown',
      error as AuthError
    )
  }
}
