/**
 * Development Mode Utilities
 * Provides mock data and development-specific functionality
 */

// Check if we're in development mode
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV || 
         import.meta.env.VITE_DEBUG_MODE === 'true' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.Cypress // Also consider Cypress as development mode
}

// Check if we're in testing mode (Cypress)
export const isTestingMode = (): boolean => {
  return window.Cypress || 
         import.meta.env.VITE_TESTING_MODE === 'true'
}

// Mock canvas data for development
export const getMockCanvases = () => [
  {
    id: 'mock-canvas-1',
    title: 'Sample Canvas 1',
    description: 'A sample canvas for development and testing',
    owner_id: 'dev-user',
    is_public: false,
    object_count: 5,
    collaborator_count: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'mock-canvas-2',
    title: 'Sample Canvas 2',
    description: 'Another sample canvas with more content',
    owner_id: 'dev-user',
    is_public: true,
    object_count: 12,
    collaborator_count: 4,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-canvas-3',
    title: 'Empty Canvas',
    description: 'A canvas with no objects yet',
    owner_id: 'dev-user',
    is_public: false,
    object_count: 0,
    collaborator_count: 1,
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
  }
]

// Mock user data for development
export const getMockUser = () => ({
  id: 'dev-user',
  email: 'dev@example.com',
  name: 'Development User',
  displayName: 'Development User',
  permissions: ['read', 'write', 'admin']
})

// Suppress error toasts in testing mode
export const shouldShowErrorToast = (): boolean => {
  return !isTestingMode()
}

// Development mode API wrapper
export const devModeApiWrapper = async <T>(
  apiCall: () => Promise<T>,
  mockData: T,
  errorMessage?: string
): Promise<T> => {
  if (isDevelopmentMode()) {
    try {
      // Try the real API call first
      return await apiCall()
    } catch (error) {
      console.log('API call failed in development mode, using mock data:', error)
      if (shouldShowErrorToast() && errorMessage) {
        // Only show toast if not in testing mode
        const { default: toast } = await import('react-hot-toast')
        toast.error(errorMessage)
      }
      return mockData
    }
  } else {
    // In production, always use real API
    return await apiCall()
  }
}

// Development mode delay for realistic UX
export const devModeDelay = (ms: number = 500): Promise<void> => {
  if (isDevelopmentMode()) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  return Promise.resolve()
}
