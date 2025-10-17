import { io, Socket } from 'socket.io-client'
import { CursorData } from '../types'
import { errorLogger, ErrorContext } from '../utils/errorLogger'
import { socketEventOptimizer } from '../utils/socketOptimizer'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()
  private debugMode = import.meta.env.VITE_DEBUG_SOCKET === 'true'

  connect(idToken?: string) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV || 
                         import.meta.env.VITE_DEBUG_MODE === 'true' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1'
    
    // Only log in debug mode
    if (this.debugMode) {
      console.log('=== Socket.IO Connection Debug ===')
      console.log('API URL:', API_URL)
      console.log('Development mode:', isDevelopment)
      console.log('Token length:', idToken?.length || 0)
    }
    
    const socketConfig: any = {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    }
    
    // Only add auth token if not in development mode
    if (!isDevelopment && idToken) {
      socketConfig.auth = {
        token: idToken
      }
    } else if (isDevelopment) {
      console.log('Development mode: Connecting without authentication')
    }
    
    this.socket = io(API_URL, socketConfig)

    this.socket.on('connect', () => {
      if (this.debugMode) {
        console.log('=== Socket.IO Connected Successfully ===')
        console.log('Socket ID:', this.socket?.id)
      }
      
      // Notify connection monitor of successful connection
      this.emit('connection_restored', {
        socketId: this.socket?.id,
        timestamp: Date.now()
      })
    })

    this.socket.on('disconnect', (reason) => {
      if (this.debugMode) {
        console.log('=== Socket.IO Disconnected ===')
        console.log('Reason:', reason)
      }
      
      // Notify connection monitor of disconnection
      this.emit('connection_lost', {
        reason,
        timestamp: Date.now()
      })
    })

    // Track reconnection attempts
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (this.debugMode) {
        console.log('=== Socket.IO Reconnection Attempt ===')
        console.log('Attempt:', attemptNumber)
      }
      
      this.emit('reconnection_attempt', {
        attempt: attemptNumber,
        timestamp: Date.now()
      })
    })

    this.socket.on('reconnect', (attemptNumber) => {
      if (this.debugMode) {
        console.log('=== Socket.IO Reconnected ===')
        console.log('Attempt:', attemptNumber)
      }
      
      this.emit('reconnection_success', {
        attempt: attemptNumber,
        timestamp: Date.now()
      })
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('=== Socket.IO Reconnection Error ===')
      console.error('Error:', error)
      
      this.emit('reconnection_failed', {
        error: error.message,
        timestamp: Date.now()
      })
    })

    this.socket.on('reconnect_failed', () => {
      console.error('=== Socket.IO Reconnection Failed - Max Attempts Reached ===')
      
      this.emit('reconnection_exhausted', {
        timestamp: Date.now()
      })
    })

    // Always log errors, regardless of debug mode
    this.socket.on('connect_error', (error) => {
      console.error('=== Socket.IO Connection Error ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      
      const context: ErrorContext = {
        operation: 'socket_connection',
        timestamp: Date.now(),
        additionalData: { 
          type: 'connection_error', 
          socketId: this.socket?.id,
          errorMessage: error.message
        }
      }
      
      const errorId = errorLogger.logError(error, context)
      this.emit('socket_error', { error, timestamp: Date.now(), type: 'connection_error', errorId })
    })

    this.socket.on('error', (error) => {
      console.error('=== Socket.IO Error ===')
      console.error('Error:', error)
      
      const context: ErrorContext = {
        operation: 'general',
        timestamp: Date.now(),
        additionalData: { 
          type: 'general_error', 
          socketId: this.socket?.id
        }
      }
      
      const errorId = errorLogger.logError(error, context)
      // Emit error event for components to handle
      this.emit('socket_error', { error, timestamp: Date.now(), type: 'general_error', errorId })
    })

    // Register event listeners
    this.registerEventListeners()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private registerEventListeners() {
    if (!this.socket) return

    // Canvas events
    this.socket.on('joined_canvas', (data) => {
      this.emit('joined_canvas', data)
    })

    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data)
    })

    this.socket.on('user_left', (data) => {
      this.emit('user_left', data)
    })

    this.socket.on('object_created', (data) => {
      this.emit('object_created', data)
    })

    this.socket.on('object_updated', (data) => {
      this.emit('object_updated', data)
    })

    this.socket.on('object_deleted', (data) => {
      this.emit('object_deleted', data)
    })

    // Cursor events
    this.socket.on('cursor_moved', (data: CursorData) => {
      this.emit('cursor_moved', data)
    })

    this.socket.on('cursor_left', (data) => {
      this.emit('cursor_left', data)
    })

    this.socket.on('cursors_data', (data) => {
      this.emit('cursors_data', data)
    })

    // Presence events
    this.socket.on('user_came_online', (data) => {
      this.emit('user_came_online', data)
    })

    this.socket.on('user_went_offline', (data) => {
      this.emit('user_went_offline', data)
    })

    this.socket.on('online_users', (data) => {
      this.emit('online_users', data)
    })

    // Error events for object operations
    this.socket.on('object_update_failed', (data) => {
      console.error('=== Object Update Failed ===')
      console.error('Data:', data)
      
      const context: ErrorContext = {
        operation: 'object_update',
        objectId: data.object_id,
        timestamp: Date.now(),
        additionalData: { 
          type: 'object_update_failed',
          errorData: data
        }
      }
      
      const errorId = errorLogger.logError(data.error || data, context)
      this.emit('object_update_failed', { ...data, errorId })
    })

    this.socket.on('object_create_failed', (data) => {
      console.error('=== Object Create Failed ===')
      console.error('Data:', data)
      
      const context: ErrorContext = {
        operation: 'object_create',
        objectType: data.object_type,
        timestamp: Date.now(),
        additionalData: { 
          type: 'object_create_failed',
          errorData: data
        }
      }
      
      const errorId = errorLogger.logError(data.error || data, context)
      this.emit('object_create_failed', { ...data, errorId })
    })

    this.socket.on('object_delete_failed', (data) => {
      console.error('=== Object Delete Failed ===')
      console.error('Data:', data)
      
      const context: ErrorContext = {
        operation: 'object_delete',
        objectId: data.object_id,
        timestamp: Date.now(),
        additionalData: { 
          type: 'object_delete_failed',
          errorData: data
        }
      }
      
      const errorId = errorLogger.logError(data.error || data, context)
      this.emit('object_delete_failed', { ...data, errorId })
    })
  }

  // Canvas events
  joinCanvas(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('join_canvas', { canvas_id: canvasId, id_token: idToken })
    }
  }

  leaveCanvas(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('leave_canvas', { canvas_id: canvasId, id_token: idToken })
    }
  }

  createObject(canvasId: string, idToken: string, object: { type: string; properties: Record<string, any> }) {
    if (this.socket) {
      this.socket.emit('object_created', {
        canvas_id: canvasId,
        id_token: idToken,
        object
      })
    }
  }

  updateObject(canvasId: string, idToken: string, objectId: string, properties: Record<string, any>) {
    if (this.socket) {
      this.socket.emit('object_updated', {
        canvas_id: canvasId,
        id_token: idToken,
        object_id: objectId,
        properties
      })
    }
  }

  deleteObject(canvasId: string, idToken: string, objectId: string) {
    if (this.socket) {
      this.socket.emit('object_deleted', {
        canvas_id: canvasId,
        id_token: idToken,
        object_id: objectId
      })
    }
  }

  // Cursor events
  moveCursor(canvasId: string, idToken: string, position: { x: number; y: number }) {
    if (this.socket) {
      this.socket.emit('cursor_move', {
        canvas_id: canvasId,
        id_token: idToken,
        position,
        timestamp: Date.now()
      })
    }
  }

  leaveCursor(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('cursor_leave', {
        canvas_id: canvasId,
        id_token: idToken
      })
    }
  }

  getCursors(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('get_cursors', {
        canvas_id: canvasId,
        id_token: idToken
      })
    }
  }

  // Presence events
  userOnline(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('user_online', {
        canvas_id: canvasId,
        id_token: idToken,
        timestamp: Date.now()
      })
    }
  }

  userOffline(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('user_offline', {
        canvas_id: canvasId,
        id_token: idToken
      })
    }
  }

  getOnlineUsers(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('get_online_users', {
        canvas_id: canvasId,
        id_token: idToken
      })
    }
  }

  sendHeartbeat(canvasId: string, idToken: string) {
    if (this.socket) {
      this.socket.emit('heartbeat', {
        canvas_id: canvasId,
        id_token: idToken,
        timestamp: Date.now()
      })
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Get error log for debugging (delegates to errorLogger)
  getErrorLog() {
    return errorLogger.getErrorLog()
  }

  // Clear error log (delegates to errorLogger)
  clearErrorLog() {
    errorLogger.clearLog()
  }

  // Get error statistics
  getErrorStats() {
    return errorLogger.getErrorStats()
  }

  // Socket optimization methods
  optimizeEmit(event: string, data: any, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit event:', event)
      return
    }

    // Use socket optimizer for non-critical events
    if (priority !== 'critical') {
      const eventId = socketEventOptimizer.optimizeEvent({
        type: event,
        data,
        priority,
        maxRetries: 3
      })
      
      if (this.debugMode) {
        console.log(`Optimized event ${eventId} queued:`, event, data)
      }
      return eventId
    }

    // Emit critical events immediately
    this.socket.emit(event, data)
    if (this.debugMode) {
      console.log(`Critical event emitted immediately:`, event, data)
    }
  }

  // Get socket optimization statistics
  getOptimizationStats() {
    return socketEventOptimizer.getStats()
  }

  // Get socket optimization queue status
  getOptimizationQueueStatus() {
    return socketEventOptimizer.getQueueStatus()
  }

  // Flush optimization queue
  async flushOptimizationQueue() {
    return socketEventOptimizer.flushQueue()
  }

  // Clear optimization queue
  clearOptimizationQueue() {
    socketEventOptimizer.clearQueue()
  }

  // Update optimization configuration
  updateOptimizationConfig(config: any) {
    socketEventOptimizer.updateConfig(config)
  }
}

export const socketService = new SocketService()
