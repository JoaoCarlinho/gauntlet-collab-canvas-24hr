import { useState, useCallback } from 'react'

export interface ZoomState {
  scale: number
  x: number
  y: number
}

export interface ZoomLimits {
  minScale: number
  maxScale: number
}

export interface ZoomConfig {
  limits: ZoomLimits
  step: number
  animationDuration: number
}

const DEFAULT_CONFIG: ZoomConfig = {
  limits: {
    minScale: 0.1,
    maxScale: 5.0
  },
  step: 0.1,
  animationDuration: 200
}

export const useCanvasZoom = (config: Partial<ZoomConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    x: 0,
    y: 0
  })
  
  const [isPanning, setIsPanning] = useState(false)
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 })

  // Zoom in
  const zoomIn = useCallback((centerX?: number, centerY?: number) => {
    setZoomState(prev => {
      const newScale = Math.min(
        prev.scale + finalConfig.step,
        finalConfig.limits.maxScale
      )
      
      if (newScale === prev.scale) return prev
      
      // Calculate new position to zoom towards center
      const scaleRatio = newScale / prev.scale
      const newX = centerX !== undefined 
        ? centerX - (centerX - prev.x) * scaleRatio
        : prev.x
      const newY = centerY !== undefined 
        ? centerY - (centerY - prev.y) * scaleRatio
        : prev.y
      
      return {
        scale: newScale,
        x: newX,
        y: newY
      }
    })
  }, [finalConfig.step, finalConfig.limits.maxScale])

  // Zoom out
  const zoomOut = useCallback((centerX?: number, centerY?: number) => {
    setZoomState(prev => {
      const newScale = Math.max(
        prev.scale - finalConfig.step,
        finalConfig.limits.minScale
      )
      
      if (newScale === prev.scale) return prev
      
      // Calculate new position to zoom towards center
      const scaleRatio = newScale / prev.scale
      const newX = centerX !== undefined 
        ? centerX - (centerX - prev.x) * scaleRatio
        : prev.y
      const newY = centerY !== undefined 
        ? centerY - (centerY - prev.y) * scaleRatio
        : prev.y
      
      return {
        scale: newScale,
        x: newX,
        y: newY
      }
    })
  }, [finalConfig.step, finalConfig.limits.minScale])

  // Set zoom level
  const setZoom = useCallback((scale: number, centerX?: number, centerY?: number) => {
    const clampedScale = Math.max(
      finalConfig.limits.minScale,
      Math.min(scale, finalConfig.limits.maxScale)
    )
    
    setZoomState(prev => {
      if (clampedScale === prev.scale) return prev
      
      const scaleRatio = clampedScale / prev.scale
      const newX = centerX !== undefined 
        ? centerX - (centerX - prev.x) * scaleRatio
        : prev.x
      const newY = centerY !== undefined 
        ? centerY - (centerY - prev.y) * scaleRatio
        : prev.y
      
      return {
        scale: clampedScale,
        x: newX,
        y: newY
      }
    })
  }, [finalConfig.limits.minScale, finalConfig.limits.maxScale])

  // Reset zoom and pan
  const resetZoom = useCallback(() => {
    setZoomState({
      scale: 1,
      x: 0,
      y: 0
    })
  }, [])

  // Pan functions
  const startPan = useCallback((x: number, y: number) => {
    setIsPanning(true)
    setLastPointerPosition({ x, y })
  }, [])

  const updatePan = useCallback((x: number, y: number) => {
    if (!isPanning) return
    
    setZoomState(prev => ({
      ...prev,
      x: prev.x + (x - lastPointerPosition.x),
      y: prev.y + (y - lastPointerPosition.y)
    }))
    
    setLastPointerPosition({ x, y })
  }, [isPanning, lastPointerPosition])

  const endPan = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent, stageX: number, stageY: number) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -finalConfig.step : finalConfig.step
    const newScale = Math.max(
      finalConfig.limits.minScale,
      Math.min(zoomState.scale + delta, finalConfig.limits.maxScale)
    )
    
    if (newScale !== zoomState.scale) {
      setZoom(newScale, stageX, stageY)
    }
  }, [zoomState.scale, finalConfig.step, finalConfig.limits, setZoom])

  // Convert stage coordinates to zoomed coordinates
  const stageToZoomed = useCallback((x: number, y: number) => {
    return {
      x: (x - zoomState.x) / zoomState.scale,
      y: (y - zoomState.y) / zoomState.scale
    }
  }, [zoomState])

  // Convert zoomed coordinates to stage coordinates
  const zoomedToStage = useCallback((x: number, y: number) => {
    return {
      x: x * zoomState.scale + zoomState.x,
      y: y * zoomState.scale + zoomState.y
    }
  }, [zoomState])

  // Get zoom percentage
  const getZoomPercentage = useCallback(() => {
    return Math.round(zoomState.scale * 100)
  }, [zoomState.scale])

  // Check if at zoom limits
  const isAtMinZoom = zoomState.scale <= finalConfig.limits.minScale
  const isAtMaxZoom = zoomState.scale >= finalConfig.limits.maxScale

  return {
    zoomState,
    isPanning,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
    startPan,
    updatePan,
    endPan,
    handleWheel,
    stageToZoomed,
    zoomedToStage,
    getZoomPercentage,
    isAtMinZoom,
    isAtMaxZoom,
    config: finalConfig
  }
}
