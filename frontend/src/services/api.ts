import axios from 'axios'
import { User, Canvas, CanvasObject, Invitation } from '../types'
import { getApiUrl } from '../utils/env'

const API_URL = getApiUrl()

console.log('API Service initialized with URL:', API_URL)
console.log('Full baseURL will be:', `${API_URL}/api`)

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add auth token to requests (skip in development mode)
api.interceptors.request.use((config) => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || 
                       import.meta.env.VITE_DEBUG_MODE === 'true' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1'
  
  // Skip authentication in development mode
  if (!isDevelopment) {
    const token = localStorage.getItem('idToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } else {
    console.log('Development mode: Skipping authentication for API request')
  }
  
  const fullUrl = (config.baseURL || '') + (config.url || '')
  console.log('Making API request to:', fullUrl)
  console.log('Request config:', {
    baseURL: config.baseURL,
    url: config.url,
    method: config.method,
    headers: config.headers
  })
  
  return config
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.config.url)
    return response
  },
  (error) => {
    // Filter out non-critical errors from browser extensions or third-party services
    const url = error.config?.url || ''
    const isExternalError = url.includes('/jwt') || url.includes('chrome-extension') || url.includes('moz-extension')
    
    if (!isExternalError) {
      console.error('API request failed:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        console.error('404 Error - Check if API URL is correct:', API_URL)
      }
    } else {
      // Log external errors at debug level only
      console.debug('External service error (ignored):', url, error.response?.status)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (idToken: string) => {
    const response = await api.post('/auth/register', { idToken })
    return response.data
  },
  
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  verifyToken: async (idToken: string) => {
    const response = await api.post('/auth/verify', { idToken })
    return response.data
  },
}

// Canvas API
export const canvasAPI = {
  getCanvases: async (): Promise<{ canvases: Canvas[] }> => {
    const response = await api.get('/canvas')
    return response.data
  },
  
  createCanvas: async (data: { title: string; description?: string; is_public?: boolean }): Promise<{ canvas: Canvas }> => {
    const response = await api.post('/canvas', data)
    return response.data
  },
  
  getCanvas: async (canvasId: string): Promise<{ canvas: Canvas }> => {
    const response = await api.get(`/canvas/${canvasId}`)
    return response.data
  },
  
  updateCanvas: async (canvasId: string, data: Partial<Canvas>): Promise<{ canvas: Canvas }> => {
    const response = await api.put(`/canvas/${canvasId}`, data)
    return response.data
  },
  
  deleteCanvas: async (canvasId: string): Promise<void> => {
    await api.delete(`/canvas/${canvasId}`)
  },
  
  getCanvasObjects: async (canvasId: string): Promise<{ objects: CanvasObject[] }> => {
    const response = await api.get(`/canvas/${canvasId}/objects`)
    return response.data
  },
}

// Objects API
export const objectsAPI = {
  createObject: async (data: { canvas_id: string; object_type: string; properties: Record<string, any> }): Promise<{ object: CanvasObject }> => {
    const response = await api.post('/objects', data)
    return response.data
  },
  
  getObject: async (objectId: string): Promise<{ object: CanvasObject }> => {
    const response = await api.get(`/objects/${objectId}`)
    return response.data
  },
  
  updateObject: async (objectId: string, data: { properties: Record<string, any> }): Promise<{ object: CanvasObject }> => {
    const response = await api.put(`/objects/${objectId}`, data)
    return response.data
  },
  
  deleteObject: async (objectId: string): Promise<void> => {
    await api.delete(`/objects/${objectId}`)
  },
}

// Collaboration API
export const collaborationAPI = {
  inviteUser: async (data: { canvas_id: string; invitee_email: string; permission_type: 'view' | 'edit' }): Promise<{ invitation: Invitation }> => {
    const response = await api.post('/collaboration/invite', data)
    return response.data
  },
  
  getInvitations: async (): Promise<{ invitations: Invitation[] }> => {
    const response = await api.get('/collaboration/invitations')
    return response.data
  },
  
  acceptInvitation: async (invitationId: string): Promise<{ permission: any }> => {
    const response = await api.post(`/collaboration/invitations/${invitationId}/accept`)
    return response.data
  },
  
  declineInvitation: async (invitationId: string): Promise<{ invitation: Invitation }> => {
    const response = await api.post(`/collaboration/invitations/${invitationId}/decline`)
    return response.data
  },
  
  getCollaborators: async (canvasId: string): Promise<{ collaborators: any[] }> => {
    const response = await api.get(`/collaboration/canvas/${canvasId}/collaborators`)
    return response.data
  },
  
  updateCollaboratorPermission: async (canvasId: string, userId: string, permissionType: 'view' | 'edit'): Promise<{ permission: any }> => {
    const response = await api.put(`/collaboration/canvas/${canvasId}/collaborators/${userId}`, { permission_type: permissionType })
    return response.data
  },
  
  removeCollaborator: async (canvasId: string, userId: string): Promise<void> => {
    await api.delete(`/collaboration/canvas/${canvasId}/collaborators/${userId}`)
  },
  
  getCanvasInvitations: async (canvasId: string): Promise<{ invitations: Invitation[] }> => {
    const response = await api.get(`/collaboration/canvas/${canvasId}/invitations`)
    return response.data
  },
  
  resendInvitation: async (invitationId: string): Promise<{ invitation: Invitation }> => {
    const response = await api.post(`/collaboration/invitations/${invitationId}/resend`)
    return response.data
  },
}
