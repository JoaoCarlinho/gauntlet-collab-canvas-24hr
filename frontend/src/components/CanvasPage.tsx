import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Rect, Circle, Text, Group, Line, RegularPolygon } from 'react-konva'
import { ArrowLeft, Users, Settings, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { canvasAPI } from '../services/api'
import { socketService } from '../services/socket'
import { Canvas, CanvasObject, CursorData } from '../types'
import { errorLogger } from '../utils/errorLogger'
import { objectUpdateService } from '../services/objectUpdateService'
import toast from 'react-hot-toast'
import InviteCollaboratorModal from './InviteCollaboratorModal'
import PresenceIndicators from './PresenceIndicators'
import UserStatus from './UserStatus'
import CollaborationSidebar from './CollaborationSidebar'
import NotificationCenter from './NotificationCenter'
import ZoomableCanvas from './ZoomableCanvas'
import EditableText from './EditableText'
import ResizeHandles from './ResizeHandles'
import SelectionIndicator from './SelectionIndicator'
import CursorTooltip from './CursorTooltip'
import PointerIndicator from './PointerIndicator'
import { getUserColor, getUserInitials, getCursorIcon } from '../utils/cursorUtils'
import { getCursorManager, CursorState } from '../utils/cursorManager'
import { FloatingToolbar, useToolbarState, useToolShortcuts, getToolById } from './toolbar'

const CanvasPage: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isConnected } = useSocket()
  
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [cursors, setCursors] = useState<CursorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [newObject, setNewObject] = useState<Partial<CanvasObject> | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCollaborationSidebar, setShowCollaborationSidebar] = useState(false)
  
  // Floating toolbar state
  const {
    preferences,
    selectedTool,
    isVisible: isToolbarVisible,
    updatePreferences,
    selectTool,
    toggleVisibility: toggleToolbarVisibility,
    updatePosition,
    toggleCollapse,
    getFilteredTools
  } = useToolbarState()
  
  // New state for enhanced object interactions
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null)
  
  // Error handling state
  const [failedUpdates, setFailedUpdates] = useState<Map<string, { error: any; timestamp: number; retryCount: number }>>(new Map())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  
  // Update progress tracking
  const [updatingObjects, setUpdatingObjects] = useState<Set<string>>(new Set())
  const [updateProgress, setUpdateProgress] = useState<Map<string, { method: string; attempt: number }>>(new Map())
  
  // Cursor tooltip state
  const [hoveredCursor, setHoveredCursor] = useState<CursorData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Pointer indicator state
  const [pointerIndicator, setPointerIndicator] = useState<{
    isVisible: boolean
    toolId: string
    position: { x: number; y: number }
    startPosition?: { x: number; y: number }
  } | null>(null)
  
  // Cursor management
  const [cursorManager] = useState(() => getCursorManager())
  
  const idToken = localStorage.getItem('idToken')
  
  // Keyboard shortcuts for tools
  useToolShortcuts({ onToolSelect: selectTool })

  useEffect(() => {
    if (!isAuthenticated || !canvasId) {
      navigate('/')
      return
    }

    loadCanvas()
    loadObjects()
    
    // Connect to socket
    if (isConnected && idToken) {
      socketService.joinCanvas(canvasId, idToken)
      socketService.userOnline(canvasId, idToken)
      socketService.getCursors(canvasId, idToken)
      socketService.getOnlineUsers(canvasId, idToken)
    }

    // Set up socket event listeners
    setupSocketListeners()

    return () => {
      if (idToken) {
        socketService.leaveCanvas(canvasId!, idToken)
        socketService.userOffline(canvasId!, idToken)
      }
    }
  }, [isAuthenticated, canvasId, isConnected])

  // Handle escape key to cancel drawing or editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawing) {
          setNewObject(null)
          setIsDrawing(false)
          selectTool(getToolById('select')!)
        } else if (editingObjectId) {
          setEditingObjectId(null)
        } else if (selectedObjectId) {
          setSelectedObjectId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawing, editingObjectId, selectedObjectId])

  // Handle tool selection changes for pointer indicators and cursor
  useEffect(() => {
    const toolsWithIndicators = ['heart', 'star', 'diamond', 'line', 'arrow']
    
    if (toolsWithIndicators.includes(selectedTool.id)) {
      setPointerIndicator({
        isVisible: true,
        toolId: selectedTool.id,
        position: { x: 0, y: 0 },
        startPosition: ['line', 'arrow'].includes(selectedTool.id) ? undefined : undefined
      })
    } else {
      setPointerIndicator(null)
    }

    // Update cursor based on selected tool
    cursorManager.handleToolSelection(selectedTool.id)
  }, [selectedTool.id, cursorManager])

  const loadCanvas = async () => {
    try {
      const response = await canvasAPI.getCanvas(canvasId!)
      setCanvas(response.canvas)
    } catch (error) {
      console.error('Failed to load canvas:', error)
      toast.error('Failed to load canvas')
      navigate('/')
    }
  }

  const loadObjects = async () => {
    try {
      const response = await canvasAPI.getCanvasObjects(canvasId!)
      setObjects(response.objects)
    } catch (error) {
      console.error('Failed to load objects:', error)
      toast.error('Failed to load objects')
    } finally {
      setIsLoading(false)
    }
  }

  const setupSocketListeners = () => {
    // Object events
    socketService.on('object_created', (data: { object: CanvasObject }) => {
      setObjects(prev => [...prev, data.object])
    })

    socketService.on('object_updated', (data: { object: CanvasObject }) => {
      setObjects(prev => prev.map(obj => 
        obj.id === data.object.id ? data.object : obj
      ))
    })

    socketService.on('object_deleted', (data: { object_id: string }) => {
      setObjects(prev => prev.filter(obj => obj.id !== data.object_id))
    })

    // Cursor events
    socketService.on('cursor_moved', (data: CursorData) => {
      setCursors(prev => {
        const filtered = prev.filter(cursor => cursor.user_id !== data.user_id)
        return [...filtered, data]
      })
    })

    socketService.on('cursor_left', (data: { user_id: string }) => {
      setCursors(prev => prev.filter(cursor => cursor.user_id !== data.user_id))
    })

    socketService.on('cursors_data', (data: { cursors: CursorData[] }) => {
      setCursors(data.cursors)
    })

    // Presence events
    socketService.on('user_joined', (data: { user: any }) => {
      toast.success(`${data.user.name} joined the canvas`)
    })

    socketService.on('user_left', (data: { user_name: string }) => {
      toast(`${data.user_name} left the canvas`)
    })

    // Connection status monitoring
    socketService.on('joined_canvas', () => {
      setConnectionStatus('connected')
      toast.success('Connected to canvas', { duration: 2000 })
    })

    // Error event listeners
    socketService.on('socket_error', (data: { error: any; timestamp: number; type: string }) => {
      console.error('Socket error received:', data)
      setConnectionStatus('error')
      
      // Show user-friendly error message based on error type
      let errorMessage = 'Connection error occurred'
      if (data.type === 'connection_error') {
        errorMessage = 'Lost connection to server. Attempting to reconnect...'
      } else if (data.type === 'general_error') {
        errorMessage = 'Network error occurred. Some features may be limited.'
      }
      
      toast.error(errorMessage, { duration: 5000 })
    })

    socketService.on('object_update_failed', (data: { object_id: string; error: any; message?: string }) => {
      console.error('Object update failed:', data)
      
      // Track failed update for retry mechanism
      setFailedUpdates(prev => {
        const newMap = new Map(prev)
        newMap.set(data.object_id, {
          error: data.error,
          timestamp: Date.now(),
          retryCount: (prev.get(data.object_id)?.retryCount || 0) + 1
        })
        return newMap
      })
      
      // Show user-friendly error message
      const errorMessage = data.message || 'Failed to update object position'
      toast.error(`${errorMessage}. Fallback mechanism will handle retry.`, { 
        duration: 4000,
        action: {
          label: 'View Details',
          onClick: () => {
            console.log('Object update failed details:', data)
            toast('Check console for details', { duration: 2000 })
          }
        }
      })
    })

    socketService.on('object_create_failed', (data: { object_type: string; error: any; message?: string }) => {
      console.error('Object creation failed:', data)
      
      const errorMessage = data.message || `Failed to create ${data.object_type}`
      toast.error(errorMessage, { duration: 4000 })
    })

    socketService.on('object_delete_failed', (data: { object_id: string; error: any; message?: string }) => {
      console.error('Object deletion failed:', data)
      
      const errorMessage = data.message || 'Failed to delete object'
      toast.error(errorMessage, { duration: 4000 })
    })

    // Online users are now handled by PresenceIndicators component
  }

  // New handler functions for enhanced interactions
  const handleObjectSelect = (objectId: string) => {
    if (selectedTool.id === 'select') {
      setSelectedObjectId(objectId)
      setEditingObjectId(null)
    }
  }

  const handleStartTextEdit = (objectId: string) => {
    setEditingObjectId(objectId)
    setSelectedObjectId(objectId)
  }

  const handleEndTextEdit = async (objectId: string, newText: string) => {
    if (idToken && newText !== objects.find(obj => obj.id === objectId)?.properties.text) {
      await socketService.updateObject(canvasId!, idToken, objectId, {
        text: newText
      })
    }
    setEditingObjectId(null)
  }

  const handleObjectResize = async (objectId: string, newProperties: any) => {
    if (!idToken || !canvasId) return

    // Mark object as updating
    setUpdatingObjects(prev => new Set(prev).add(objectId))
    setUpdateProgress(prev => new Map(prev).set(objectId, { method: 'socket', attempt: 1 }))

    try {
      const result = await objectUpdateService.updateObjectProperties(
        canvasId,
        idToken,
        objectId,
        newProperties,
        {
          useOptimisticUpdate: true,
          retryOptions: {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 4000,
            backoffMultiplier: 2,
            jitter: true
          },
          onProgress: (attempt, method) => {
            setUpdateProgress(prev => new Map(prev).set(objectId, { method, attempt }))
          }
        }
      )

      if (result.success) {
        // Update successful - remove from failed updates if it was there
        setFailedUpdates(prev => {
          const newMap = new Map(prev)
          newMap.delete(objectId)
          return newMap
        })

        // Show success message for REST fallback
        if (result.method === 'rest') {
          toast.success('Object resized (using backup method)', { duration: 2000 })
        }
      } else {
        // Update failed - track for retry
        setFailedUpdates(prev => {
          const newMap = new Map(prev)
          newMap.set(objectId, {
            error: result.error,
            timestamp: Date.now(),
            retryCount: (prev.get(objectId)?.retryCount || 0) + 1
          })
          return newMap
        })

        // Show error message with retry option
        toast.error(`Failed to resize object: ${result.error?.message || 'Unknown error'}`, {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry the update
              handleObjectResize(objectId, newProperties)
            }
          }
        })
      }
    } catch (error) {
      console.error('Unexpected error in handleObjectResize:', error)
      toast.error('Unexpected error occurred while resizing object')
    } finally {
      // Clean up update tracking
      setUpdatingObjects(prev => {
        const newSet = new Set(prev)
        newSet.delete(objectId)
        return newSet
      })
      setUpdateProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(objectId)
        return newMap
      })
    }
  }

  const handleObjectUpdatePosition = async (objectId: string, x: number, y: number) => {
    if (!idToken || !canvasId) return

    // Mark object as updating
    setUpdatingObjects(prev => new Set(prev).add(objectId))
    setUpdateProgress(prev => new Map(prev).set(objectId, { method: 'socket', attempt: 1 }))

    try {
      const result = await objectUpdateService.updateObjectPosition(
        canvasId,
        idToken,
        objectId,
        x,
        y,
        {
          useOptimisticUpdate: true,
          retryOptions: {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 4000,
            backoffMultiplier: 2,
            jitter: true
          },
          onProgress: (attempt, method) => {
            setUpdateProgress(prev => new Map(prev).set(objectId, { method, attempt }))
          }
        }
      )

      if (result.success) {
        // Update successful - remove from failed updates if it was there
        setFailedUpdates(prev => {
          const newMap = new Map(prev)
          newMap.delete(objectId)
          return newMap
        })

        // Show success message for REST fallback
        if (result.method === 'rest') {
          toast.success('Object updated (using backup method)', { duration: 2000 })
        }
      } else {
        // Update failed - track for retry
        setFailedUpdates(prev => {
          const newMap = new Map(prev)
          newMap.set(objectId, {
            error: result.error,
            timestamp: Date.now(),
            retryCount: (prev.get(objectId)?.retryCount || 0) + 1
          })
          return newMap
        })

        // Show error message with retry option
        toast.error(`Failed to update object position: ${result.error?.message || 'Unknown error'}`, {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry the update
              handleObjectUpdatePosition(objectId, x, y)
            }
          }
        })
      }
    } catch (error) {
      console.error('Unexpected error in handleObjectUpdatePosition:', error)
      toast.error('Unexpected error occurred while updating object')
    } finally {
      // Clean up update tracking
      setUpdatingObjects(prev => {
        const newSet = new Set(prev)
        newSet.delete(objectId)
        return newSet
      })
      setUpdateProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(objectId)
        return newMap
      })
    }
  }

  const handleCursorChange = (_cursor: CursorState) => {
    // Cursor is managed by cursorManager, no local state needed
  }

  const handleCursorReset = () => {
    cursorManager.resetCursor()
  }

  // Cursor tooltip handlers
  const handleCursorHover = (cursor: CursorData, event: any) => {
    const stage = event.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    setHoveredCursor(cursor)
    setTooltipPosition({
      x: pointerPosition.x,
      y: pointerPosition.y
    })
    setShowTooltip(true)
  }

  const handleCursorLeave = () => {
    setShowTooltip(false)
    setHoveredCursor(null)
  }

  const handleStageClick = (e: any) => {
    // Clear selection if clicking on empty space
    if (selectedTool.id === 'select' && e.target === e.target.getStage()) {
      setSelectedObjectId(null)
      setEditingObjectId(null)
      return
    }
    
    if (selectedTool.id === 'select') return
    
    // Prevent creating new objects while already drawing
    if (isDrawing) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    // Get tool properties with defaults
    const toolProps = selectedTool.properties || {}
    const strokeColor = toolProps.strokeColor || '#000000'
    const fillColor = toolProps.fillColor || 'transparent'
    const strokeWidth = toolProps.strokeWidth || 2

    if (selectedTool.id === 'rectangle') {
      const rect = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'rectangle' as const,
        properties: {
          x: point.x,
          y: point.y,
          width: 100,
          height: 60,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(rect)
      setIsDrawing(true)
    } else if (selectedTool.id === 'circle') {
      const circle = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'circle' as const,
        properties: {
          x: point.x,
          y: point.y,
          radius: 50,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(circle)
      setIsDrawing(true)
    } else if (selectedTool.id === 'text') {
      const text = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'text' as const,
        properties: {
          x: point.x,
          y: point.y,
          text: 'Click to edit',
          fontSize: toolProps.fontSize || 16,
          fontFamily: toolProps.fontFamily || 'Arial',
          fill: strokeColor
        },
        created_by: user?.id || ''
      }
      setNewObject(text)
      setIsDrawing(true)
    } else if (selectedTool.id === 'heart') {
      const heart = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'heart' as const,
        properties: {
          x: point.x,
          y: point.y,
          width: 40,
          height: 40,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(heart)
      setIsDrawing(true)
    } else if (selectedTool.id === 'star') {
      const star = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'star' as const,
        properties: {
          x: point.x,
          y: point.y,
          width: 40,
          height: 40,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(star)
      setIsDrawing(true)
    } else if (selectedTool.id === 'diamond') {
      const diamond = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'diamond' as const,
        properties: {
          x: point.x,
          y: point.y,
          width: 40,
          height: 40,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(diamond)
      setIsDrawing(true)
    } else if (selectedTool.id === 'line') {
      const line = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'line' as const,
        properties: {
          x: point.x,
          y: point.y,
          points: [0, 0, 100, 0],
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(line)
      setIsDrawing(true)
    } else if (selectedTool.id === 'arrow') {
      const arrow = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'arrow' as const,
        properties: {
          x: point.x,
          y: point.y,
          points: [0, 0, 100, 0],
          stroke: strokeColor,
          strokeWidth: strokeWidth
        },
        created_by: user?.id || ''
      }
      setNewObject(arrow)
      setIsDrawing(true)
    }
  }

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    // Update cursor position
    if (idToken) {
      socketService.moveCursor(canvasId!, idToken, point)
    }

    // Update pointer indicator position
    if (pointerIndicator && pointerIndicator.isVisible) {
      setPointerIndicator(prev => prev ? {
        ...prev,
        position: point
      } : null)
    }

    // Handle drawing mode updates
    if (!isDrawing || !newObject || !idToken) return

    // Update new object position
    if (newObject.object_type === 'rectangle') {
      setNewObject(prev => ({
        ...prev,
        properties: {
          ...prev!.properties!,
          width: Math.max(10, point.x - prev!.properties!.x),
          height: Math.max(10, point.y - prev!.properties!.y)
        }
      }))
    } else if (newObject.object_type === 'circle') {
      const radius = Math.sqrt(
        Math.pow(point.x - newObject.properties!.x, 2) + 
        Math.pow(point.y - newObject.properties!.y, 2)
      )
      setNewObject(prev => ({
        ...prev,
        properties: {
          ...prev!.properties!,
          radius: Math.max(10, radius)
        }
      }))
    } else if (['heart', 'star', 'diamond'].includes(newObject.object_type!)) {
      // For shape tools, update size based on distance from start point
      const width = Math.max(20, Math.abs(point.x - newObject.properties!.x) * 2)
      const height = Math.max(20, Math.abs(point.y - newObject.properties!.y) * 2)
      setNewObject(prev => ({
        ...prev,
        properties: {
          ...prev!.properties!,
          width: width,
          height: height
        }
      }))
    } else if (['line', 'arrow'].includes(newObject.object_type!)) {
      // For line tools, update the end point
      const dx = point.x - newObject.properties!.x
      const dy = point.y - newObject.properties!.y
      setNewObject(prev => ({
        ...prev,
        properties: {
          ...prev!.properties!,
          points: [0, 0, dx, dy]
        }
      }))
    }
  }

  const handleStageMouseUp = () => {
    if (isDrawing && newObject && idToken) {
      // Create object via socket
      socketService.createObject(canvasId!, idToken, {
        type: newObject.object_type!,
        properties: newObject.properties!
      })
      
      setNewObject(null)
      setIsDrawing(false)
    }
  }

  const renderObject = (obj: CanvasObject) => {
    const props = obj.properties
    const isSelected = selectedObjectId === obj.id
    const isEditing = editingObjectId === obj.id
    const isHovered = hoveredObjectId === obj.id

    switch (obj.object_type) {
      case 'rectangle':
        return (
          <Group key={obj.id}>
            <Rect
              x={props.x}
              y={props.y}
              width={props.width}
              height={props.height}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            />
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'circle':
        return (
          <Group key={obj.id}>
            <Circle
              x={props.x}
              y={props.y}
              radius={props.radius}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            />
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'text':
        return (
          <EditableText
            key={obj.id}
            object={obj}
            isSelected={isSelected}
            isEditing={isEditing}
            onStartEdit={handleStartTextEdit}
            onEndEdit={handleEndTextEdit}
            onSelect={handleObjectSelect}
            onUpdatePosition={handleObjectUpdatePosition}
            selectedTool={selectedTool.id}
          />
        )
      case 'heart':
        return (
          <Group key={obj.id}>
            <Group x={props.x} y={props.y}>
              <Circle
                x={-props.width * 0.3}
                y={-props.height * 0.2}
                radius={props.width * 0.2}
                fill={props.fill}
                stroke={props.stroke}
                strokeWidth={props.strokeWidth}
                draggable={selectedTool.id === 'select' && !isEditing}
                onClick={() => handleObjectSelect(obj.id)}
                onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
                onMouseEnter={() => setHoveredObjectId(obj.id)}
                onMouseLeave={() => setHoveredObjectId(null)}
              />
              <Circle
                x={props.width * 0.3}
                y={-props.height * 0.2}
                radius={props.width * 0.2}
                fill={props.fill}
                stroke={props.stroke}
                strokeWidth={props.strokeWidth}
              />
              <RegularPolygon
                x={0}
                y={props.height * 0.3}
                sides={3}
                radius={props.width * 0.3}
                rotation={180}
                fill={props.fill}
                stroke={props.stroke}
                strokeWidth={props.strokeWidth}
              />
            </Group>
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'star':
        return (
          <Group key={obj.id}>
            <RegularPolygon
              x={props.x}
              y={props.y}
              sides={5}
              radius={props.width / 2}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            />
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'diamond':
        return (
          <Group key={obj.id}>
            <RegularPolygon
              x={props.x}
              y={props.y}
              sides={4}
              radius={props.width / 2}
              rotation={45}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            />
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'line':
        return (
          <Group key={obj.id}>
            <Line
              x={props.x}
              y={props.y}
              points={props.points || [0, 0, 100, 0]}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            />
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      case 'arrow':
        return (
          <Group key={obj.id}>
            <Group
              x={props.x}
              y={props.y}
              draggable={selectedTool.id === 'select' && !isEditing}
              onClick={() => handleObjectSelect(obj.id)}
              onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
              onMouseEnter={() => setHoveredObjectId(obj.id)}
              onMouseLeave={() => setHoveredObjectId(null)}
            >
              <Line
                x={0}
                y={0}
                points={props.points || [0, 0, 100, 0]}
                stroke={props.stroke}
                strokeWidth={props.strokeWidth}
              />
              {props.points && props.points.length >= 4 && (
                <Group
                  x={props.points[2]}
                  y={props.points[3]}
                  rotation={Math.atan2(props.points[3], props.points[2]) * (180 / Math.PI)}
                >
                  <Line
                    x={0}
                    y={0}
                    points={[-15, -8, 0, 0, -15, 8]}
                    stroke={props.stroke}
                    strokeWidth={props.strokeWidth}
                  />
                </Group>
              )}
            </Group>
            <SelectionIndicator 
              object={obj} 
              isSelected={isSelected} 
              isHovered={isHovered && !isSelected} 
            />
            <ResizeHandles 
              object={obj} 
              isSelected={isSelected} 
              onResize={handleObjectResize}
              onCursorChange={handleCursorChange}
              onCursorReset={handleCursorReset}
            />
          </Group>
        )
      default:
        return null
    }
  }

  const renderNewObject = () => {
    if (!newObject) return null

    const props = newObject.properties!

    switch (newObject.object_type) {
      case 'rectangle':
        return (
          <Rect
            x={props.x}
            y={props.y}
            width={props.width}
            height={props.height}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            opacity={0.7}
          />
        )
      case 'circle':
        return (
          <Circle
            x={props.x}
            y={props.y}
            radius={props.radius}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            opacity={0.7}
          />
        )
      case 'text':
        return (
          <Text
            x={props.x}
            y={props.y}
            text={props.text}
            fontSize={props.fontSize}
            fill={props.fill}
            fontFamily={props.fontFamily}
            opacity={0.7}
          />
        )
      case 'heart':
        return (
          <Group x={props.x} y={props.y} opacity={0.7}>
            <Circle
              x={-props.width * 0.3}
              y={-props.height * 0.2}
              radius={props.width * 0.2}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
            />
            <Circle
              x={props.width * 0.3}
              y={-props.height * 0.2}
              radius={props.width * 0.2}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
            />
            <RegularPolygon
              x={0}
              y={props.height * 0.3}
              sides={3}
              radius={props.width * 0.3}
              rotation={180}
              fill={props.fill}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
            />
          </Group>
        )
      case 'star':
        return (
          <RegularPolygon
            x={props.x}
            y={props.y}
            sides={5}
            radius={props.width / 2}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            opacity={0.7}
          />
        )
      case 'diamond':
        return (
          <RegularPolygon
            x={props.x}
            y={props.y}
            sides={4}
            radius={props.width / 2}
            rotation={45}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            opacity={0.7}
          />
        )
      case 'line':
        return (
          <Line
            x={props.x}
            y={props.y}
            points={props.points}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            opacity={0.7}
          />
        )
      case 'arrow':
        return (
          <Group opacity={0.7}>
            <Line
              x={props.x}
              y={props.y}
              points={props.points}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
            />
            {props.points && props.points.length >= 4 && (
              <Group
                x={props.x + props.points[2]}
                y={props.y + props.points[3]}
                rotation={Math.atan2(props.points[3], props.points[2]) * (180 / Math.PI)}
              >
                <Line
                  x={0}
                  y={0}
                  points={[-15, -8, 0, 0, -15, 8]}
                  stroke={props.stroke}
                  strokeWidth={props.strokeWidth}
                />
              </Group>
            )}
          </Group>
        )
      default:
        return null
    }
  }

  const renderCursors = () => {
    return cursors.map((cursor) => {
      const userColor = getUserColor(cursor.user_id)
      const userInitials = getUserInitials(cursor.user_name)
      const cursorIcon = getCursorIcon(cursor.user_id)
      
      return (
        <Group
          key={cursor.user_id}
          x={cursor.position.x}
          y={cursor.position.y}
          onMouseEnter={(e) => handleCursorHover(cursor, e)}
          onMouseLeave={handleCursorLeave}
        >
          {/* Cursor pointer icon */}
          <Text
            x={-8}
            y={-8}
            text={cursorIcon}
            fontSize={16}
            fill={userColor}
            fontFamily="Arial"
          />
          
          {/* User avatar circle */}
          <Circle
            x={0}
            y={0}
            radius={12}
            fill={userColor}
            stroke="#fff"
            strokeWidth={2}
            opacity={0.9}
          />
          
          {/* User initials */}
          <Text
            x={-4}
            y={-4}
            text={userInitials}
            fontSize={8}
            fill="#fff"
            fontFamily="Arial"
            fontStyle="bold"
          />
        </Group>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!canvas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Canvas not found</h2>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{canvas.title}</h1>
            <p className="text-sm text-gray-600">{canvas.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Presence Indicators */}
          <PresenceIndicators 
            canvasId={canvasId!} 
            currentUserId={user?.id || ''} 
            maxVisible={3}
          />
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* User Status */}
          {user && (
            <UserStatus 
              compact={true}
            />
          )}
          
          {/* Collaboration buttons - only show for canvas owner */}
          {canvas && user && canvas.owner_id === user.id && (
            <>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                title="Invite collaborators"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
              
              <button
                onClick={() => setShowCollaborationSidebar(!showCollaborationSidebar)}
                className={`p-2 rounded-lg transition-colors ${
                  showCollaborationSidebar 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Collaboration panel"
              >
                <Users className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Notification Center */}
          <NotificationCenter />
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Drawing Status Bar */}
      {isDrawing && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Drawing in progress... Click to place {selectedTool.name.toLowerCase()} object
            </span>
            <button
              onClick={() => {
                setNewObject(null)
                setIsDrawing(false)
                selectTool(getToolById('select')!)
              }}
              className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
            >
              Cancel (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <ZoomableCanvas
          width={window.innerWidth}
          height={window.innerHeight - 120}
          onStageClick={handleStageClick}
          onStageMouseMove={handleStageMouseMove}
          onStageMouseUp={handleStageMouseUp}
          showZoomControls={true}
          zoomControlsPosition="bottom-right"
          enableKeyboardShortcuts={true}
        >
          {objects.map(renderObject)}
          {renderNewObject()}
          {renderCursors()}
          {pointerIndicator && (
            <PointerIndicator
              toolId={pointerIndicator.toolId}
              position={pointerIndicator.position}
              isVisible={pointerIndicator.isVisible}
              toolProperties={selectedTool.properties || {}}
              startPosition={pointerIndicator.startPosition}
            />
          )}
        </ZoomableCanvas>
      </div>

      {/* Collaboration Sidebar */}
      {canvas && user && (
        <CollaborationSidebar
          canvasId={canvasId!}
          canvasTitle={canvas.title}
          currentUserId={user.id}
          isOwner={canvas.owner_id === user.id}
          isOpen={showCollaborationSidebar}
          onClose={() => setShowCollaborationSidebar(false)}
        />
      )}

      {/* Invitation Modal */}
      {canvas && (
        <InviteCollaboratorModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          canvasId={canvasId!}
          canvasTitle={canvas.title}
        />
      )}

      {/* Cursor Tooltip */}
      {hoveredCursor && (
        <CursorTooltip
          cursor={hoveredCursor}
          position={tooltipPosition}
          isVisible={showTooltip}
          onClose={handleCursorLeave}
        />
      )}

      {/* Floating Drawing Toolbar */}
      <FloatingToolbar
        position={preferences.position}
        isVisible={isToolbarVisible}
        selectedTool={selectedTool}
        onToolSelect={selectTool}
        onPositionChange={updatePosition}
        onVisibilityToggle={toggleToolbarVisibility}
        onCollapseToggle={toggleCollapse}
        tools={getFilteredTools()}
        preferences={preferences}
        onPreferencesChange={updatePreferences}
      />

      {/* Debug Panel - Only show in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            🐛 Debug
          </button>
          
          {showDebugPanel && (
            <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-sm mb-2">Error Debug Panel</h3>
              
              <div className="space-y-2 text-xs">
                <div>
                  <strong>Connection Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {connectionStatus}
                  </span>
                </div>
                
                <div>
                  <strong>Failed Updates:</strong> {failedUpdates.size}
                </div>
                
                <div>
                  <strong>Updating Objects:</strong> {updatingObjects.size}
                </div>
                
                <div>
                  <strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}
                </div>
                
                {updatingObjects.size > 0 && (
                  <div className="mt-2">
                    <strong>Update Progress:</strong>
                    <div className="text-xs mt-1">
                      {Array.from(updatingObjects).map(objectId => {
                        const progress = updateProgress.get(objectId)
                        return (
                          <div key={objectId} className="flex justify-between">
                            <span>{objectId.slice(0, 8)}...</span>
                            <span className="text-blue-600">
                              {progress?.method} (attempt {progress?.attempt})
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <button
                    onClick={() => {
                      const stats = errorLogger.getErrorStats()
                      console.log('Error Statistics:', stats)
                      console.log('Error Log:', errorLogger.getErrorLog())
                    }}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Log Stats to Console
                  </button>
                </div>
                
                <div>
                  <button
                    onClick={() => {
                      const log = errorLogger.exportLog()
                      navigator.clipboard.writeText(log)
                      toast.success('Error log copied to clipboard')
                    }}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                  >
                    Export Error Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CanvasPage
