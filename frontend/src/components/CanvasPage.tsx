import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Rect, Circle, Text, Group } from 'react-konva'
import { ArrowLeft, Users, Settings, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { canvasAPI } from '../services/api'
import { socketService } from '../services/socket'
import { Canvas, CanvasObject, CursorData } from '../types'
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

const CanvasPage: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isConnected } = useSocket()
  
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [cursors, setCursors] = useState<CursorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text'>('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [newObject, setNewObject] = useState<Partial<CanvasObject> | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCollaborationSidebar, setShowCollaborationSidebar] = useState(false)
  
  // New state for enhanced object interactions
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const idToken = localStorage.getItem('idToken')

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
          setSelectedTool('select')
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

    // Online users are now handled by PresenceIndicators component
  }

  // New handler functions for enhanced interactions
  const handleObjectSelect = (objectId: string) => {
    if (selectedTool === 'select') {
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
    if (idToken) {
      await socketService.updateObject(canvasId!, idToken, objectId, newProperties)
    }
  }

  const handleObjectUpdatePosition = async (objectId: string, x: number, y: number) => {
    if (idToken) {
      await socketService.updateObject(canvasId!, idToken, objectId, { x, y })
    }
  }

  const handleStageClick = (e: any) => {
    // Clear selection if clicking on empty space
    if (selectedTool === 'select' && e.target === e.target.getStage()) {
      setSelectedObjectId(null)
      setEditingObjectId(null)
      return
    }
    
    if (selectedTool === 'select') return
    
    // Prevent creating new objects while already drawing
    if (isDrawing) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    if (selectedTool === 'rectangle') {
      const rect = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'rectangle' as const,
        properties: {
          x: point.x,
          y: point.y,
          width: 100,
          height: 60,
          fill: '#3b82f6',
          stroke: '#1d4ed8',
          strokeWidth: 2
        },
        created_by: user?.id || ''
      }
      setNewObject(rect)
      setIsDrawing(true)
    } else if (selectedTool === 'circle') {
      const circle = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'circle' as const,
        properties: {
          x: point.x,
          y: point.y,
          radius: 50,
          fill: '#10b981',
          stroke: '#059669',
          strokeWidth: 2
        },
        created_by: user?.id || ''
      }
      setNewObject(circle)
      setIsDrawing(true)
    } else if (selectedTool === 'text') {
      const text = {
        id: `temp-${Date.now()}`,
        canvas_id: canvasId!,
        object_type: 'text' as const,
        properties: {
          x: point.x,
          y: point.y,
          text: 'Click to edit',
          fontSize: 16,
          fill: '#374151',
          fontFamily: 'Arial'
        },
        created_by: user?.id || ''
      }
      setNewObject(text)
      setIsDrawing(true)
    }
  }

  const handleStageMouseMove = (e: any) => {
    if (!isDrawing || !newObject || !idToken) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()

    // Update cursor position
    socketService.moveCursor(canvasId!, idToken, point)

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
              draggable={selectedTool === 'select' && !isEditing}
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
              draggable={selectedTool === 'select' && !isEditing}
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
            selectedTool={selectedTool}
          />
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
      default:
        return null
    }
  }

  const renderCursors = () => {
    return cursors.map((cursor) => (
      <Text
        key={cursor.user_id}
        x={cursor.position.x}
        y={cursor.position.y - 20}
        text={`👆 ${cursor.user_name}`}
        fontSize={12}
        fill="#3b82f6"
        fontFamily="Arial"
      />
    ))
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

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTool('select')}
            disabled={isDrawing}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'select' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Select
          </button>
          <button
            onClick={() => setSelectedTool('rectangle')}
            disabled={isDrawing}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'rectangle' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Rectangle
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            disabled={isDrawing}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'circle' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Circle
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            disabled={isDrawing}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'text' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            } ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Text
          </button>
          {isDrawing && (
            <>
              <span className="ml-4 text-sm text-gray-600">
                Drawing in progress... Click to place object
              </span>
              <button
                onClick={() => {
                  setNewObject(null)
                  setIsDrawing(false)
                  setSelectedTool('select')
                }}
                className="ml-2 px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
              >
                Cancel (ESC)
              </button>
            </>
          )}
        </div>
      </div>

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
    </div>
  )
}

export default CanvasPage
