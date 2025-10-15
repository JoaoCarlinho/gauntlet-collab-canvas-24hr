import { useCallback, useRef } from 'react'

interface TouchPoint {
  x: number
  y: number
  id: number
}

interface TouchGestureState {
  touches: TouchPoint[]
  lastDistance: number
  lastCenter: { x: number; y: number }
  isGesturing: boolean
}

export const useTouchGestures = () => {
  const gestureState = useRef<TouchGestureState>({
    touches: [],
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    isGesturing: false
  })

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint) => {
    const dx = touch1.x - touch2.x
    const dy = touch1.y - touch2.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate center point between two touches
  const getCenter = useCallback((touch1: TouchPoint, touch2: TouchPoint) => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2
    }
  }, [])

  // Convert touch list to our format
  const getTouchPoints = useCallback((touches: TouchList): TouchPoint[] => {
    return Array.from(touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier
    }))
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((
    e: TouchEvent,
    onPanStart?: (x: number, y: number) => void,
    onPinchStart?: (centerX: number, centerY: number, distance: number) => void
  ) => {
    e.preventDefault()
    
    const touches = getTouchPoints(e.touches)
    gestureState.current.touches = touches

    if (touches.length === 1) {
      // Single touch - start panning
      gestureState.current.isGesturing = true
      if (onPanStart) {
        onPanStart(touches[0].x, touches[0].y)
      }
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      const distance = getDistance(touches[0], touches[1])
      const center = getCenter(touches[0], touches[1])
      
      gestureState.current.lastDistance = distance
      gestureState.current.lastCenter = center
      gestureState.current.isGesturing = true
      
      if (onPinchStart) {
        onPinchStart(center.x, center.y, distance)
      }
    }
  }, [getTouchPoints, getDistance, getCenter])

  // Handle touch move
  const handleTouchMove = useCallback((
    e: TouchEvent,
    onPanMove?: (x: number, y: number) => void,
    onPinchMove?: (centerX: number, centerY: number, distance: number, scale: number) => void
  ) => {
    e.preventDefault()
    
    if (!gestureState.current.isGesturing) return
    
    const touches = getTouchPoints(e.touches)
    
    if (touches.length === 1 && gestureState.current.touches.length === 1) {
      // Single touch panning
      if (onPanMove) {
        onPanMove(touches[0].x, touches[0].y)
      }
    } else if (touches.length === 2 && gestureState.current.touches.length === 2) {
      // Two finger pinch zoom
      const distance = getDistance(touches[0], touches[1])
      const center = getCenter(touches[0], touches[1])
      
      const scale = distance / gestureState.current.lastDistance
      
      if (onPinchMove) {
        onPinchMove(center.x, center.y, distance, scale)
      }
      
      gestureState.current.lastDistance = distance
      gestureState.current.lastCenter = center
    }
    
    gestureState.current.touches = touches
  }, [getTouchPoints, getDistance, getCenter])

  // Handle touch end
  const handleTouchEnd = useCallback((
    e: TouchEvent,
    onPanEnd?: () => void,
    onPinchEnd?: () => void
  ) => {
    e.preventDefault()
    
    const touches = getTouchPoints(e.touches)
    
    if (touches.length === 0) {
      // All touches ended
      gestureState.current.isGesturing = false
      gestureState.current.touches = []
      
      if (onPanEnd) onPanEnd()
      if (onPinchEnd) onPinchEnd()
    } else if (touches.length === 1 && gestureState.current.touches.length === 2) {
      // Switched from pinch to pan
      gestureState.current.touches = touches
      // Could add transition logic here
    }
  }, [getTouchPoints])

  // Handle touch cancel
  const handleTouchCancel = useCallback((
    e: TouchEvent,
    onPanEnd?: () => void,
    onPinchEnd?: () => void
  ) => {
    e.preventDefault()
    
    gestureState.current.isGesturing = false
    gestureState.current.touches = []
    
    if (onPanEnd) onPanEnd()
    if (onPinchEnd) onPinchEnd()
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isGesturing: gestureState.current.isGesturing
  }
}
