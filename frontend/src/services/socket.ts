import { io, Socket } from 'socket.io-client'
import { CursorData } from '../types'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(idToken: string) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    console.log('=== Socket.IO Connection Debug ===')
    console.log('API URL:', API_URL)
    console.log('Token length:', idToken.length)
    console.log('Token starts with:', idToken.substring(0, 50) + '...')
    
    this.socket = io(API_URL, {
      auth: {
        token: idToken
      },
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('=== Socket.IO Connected Successfully ===')
      console.log('Socket ID:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('=== Socket.IO Disconnected ===')
      console.log('Reason:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('=== Socket.IO Connection Error ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
    })

    this.socket.on('error', (error) => {
      console.error('=== Socket.IO Error ===')
      console.error('Error:', error)
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
}

export const socketService = new SocketService()
