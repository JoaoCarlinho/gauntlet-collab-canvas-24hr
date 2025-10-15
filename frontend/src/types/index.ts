export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Canvas {
  id: string
  title: string
  description: string
  owner_id: string
  is_public: boolean
  created_at: string
  updated_at: string
  object_count: number
  collaborator_count: number
}

export interface CanvasObject {
  id: string
  canvas_id: string
  object_type: 'rectangle' | 'circle' | 'text'
  properties: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface CanvasPermission {
  id: number
  canvas_id: string
  user_id: string
  permission_type: 'view' | 'edit'
  granted_at: string
  granted_by: string
}

export interface Invitation {
  id: string
  canvas_id: string
  inviter_id: string
  invitee_email: string
  permission_type: 'view' | 'edit'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
  updated_at: string
  is_expired: boolean
}

export interface CursorPosition {
  x: number
  y: number
}

export interface CursorData {
  user_id: string
  user_name: string
  position: CursorPosition
  timestamp: number
}

export interface OnlineUser {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  timestamp: number
}

export interface CanvasState {
  id: string
  title: string
  objects: CanvasObject[]
  cursors: CursorData[]
  onlineUsers: OnlineUser[]
  selectedObjectId: string | null
  isDragging: boolean
  zoom: number
  pan: CursorPosition
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Re-export toolbar types
export * from './toolbar'
