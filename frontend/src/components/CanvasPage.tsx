import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Circle, Text } from 'react-konva'
import { ArrowLeft, Users, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { canvasAPI } from '../services/api'
import { socketService } from '../services/socket'
import { Canvas, CanvasObject, CursorData, OnlineUser } from '../types'
import toast from 'react-hot-toast'

const CanvasPage: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isConnected } = useSocket()
  
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [cursors, setCursors] = useState<CursorData[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text'>('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [newObject, setNewObject] = useState<Partial<CanvasObject> | null>(null)
  
  const stageRef = useRef<any>(null)
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

    socketService.on('online_users', (data: { users: OnlineUser[] }) => {
      setOnlineUsers(data.users)
    })
  }

  const handleStageClick = (e: any) => {
    if (selectedTool === 'select') return

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

    switch (obj.object_type) {
      case 'rectangle':
        return (
          <Rect
            key={obj.id}
            x={props.x}
            y={props.y}
            width={props.width}
            height={props.height}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            draggable={selectedTool === 'select'}
            onDragEnd={(e) => {
              if (idToken) {
                socketService.updateObject(canvasId!, idToken, obj.id, {
                  ...props,
                  x: e.target.x(),
                  y: e.target.y()
                })
              }
            }}
          />
        )
      case 'circle':
        return (
          <Circle
            key={obj.id}
            x={props.x}
            y={props.y}
            radius={props.radius}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            draggable={selectedTool === 'select'}
            onDragEnd={(e) => {
              if (idToken) {
                socketService.updateObject(canvasId!, idToken, obj.id, {
                  ...props,
                  x: e.target.x(),
                  y: e.target.y()
                })
              }
            }}
          />
        )
      case 'text':
        return (
          <Text
            key={obj.id}
            x={props.x}
            y={props.y}
            text={props.text}
            fontSize={props.fontSize}
            fill={props.fill}
            fontFamily={props.fontFamily}
            draggable={selectedTool === 'select'}
            onDragEnd={(e) => {
              if (idToken) {
                socketService.updateObject(canvasId!, idToken, obj.id, {
                  ...props,
                  x: e.target.x(),
                  y: e.target.y()
                })
              }
            }}
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{onlineUsers.length} online</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
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
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'select' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            Select
          </button>
          <button
            onClick={() => setSelectedTool('rectangle')}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'rectangle' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            Rectangle
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'circle' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            Circle
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            className={`px-3 py-1 rounded text-sm ${
              selectedTool === 'text' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 120}
          onClick={handleStageClick}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            {objects.map(renderObject)}
            {renderNewObject()}
            {renderCursors()}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

export default CanvasPage
