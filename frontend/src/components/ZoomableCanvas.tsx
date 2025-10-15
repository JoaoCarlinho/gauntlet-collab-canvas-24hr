import React, { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import { useCanvasZoom } from '../hooks/useCanvasZoom'
import { useTouchGestures } from '../hooks/useTouchGestures'
import ZoomControls from './ZoomControls'

interface ZoomableCanvasProps {
  width: number
  height: number
  children: React.ReactNode
  onStageClick?: (e: any) => void
  onStageMouseMove?: (e: any) => void
  onStageMouseUp?: (e: any) => void
  onStageMouseDown?: (e: any) => void
  className?: string
  showZoomControls?: boolean
  zoomControlsPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  enableKeyboardShortcuts?: boolean
}

const ZoomableCanvas: React.FC<ZoomableCanvasProps> = ({
  width,
  height,
  children,
  onStageClick,
  onStageMouseMove,
  onStageMouseUp,
  onStageMouseDown,
  className = '',
  showZoomControls = true,
  zoomControlsPosition = 'bottom-right',
  enableKeyboardShortcuts = true
}) => {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
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
    getZoomPercentage,
    isAtMinZoom,
    isAtMaxZoom,
    config: finalConfig
  } = useCanvasZoom()

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isGesturing
  } = useTouchGestures()

  // Handle wheel zoom
  const handleWheelEvent = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (stageRef.current) {
      const stage = stageRef.current.getStage()
      const pointerPosition = stage.getPointerPosition()
      handleWheel(e, pointerPosition.x, pointerPosition.y)
    }
  }, [handleWheel])

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: any) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.ctrlKey)) {
      // Middle mouse button or Ctrl + left click for panning
      e.evt.preventDefault()
      const pointerPosition = e.target.getStage().getPointerPosition()
      startPan(pointerPosition.x, pointerPosition.y)
    } else if (onStageMouseDown) {
      onStageMouseDown(e)
    }
  }, [startPan, onStageMouseDown])

  const handleMouseMove = useCallback((e: any) => {
    if (isPanning) {
      const pointerPosition = e.target.getStage().getPointerPosition()
      updatePan(pointerPosition.x, pointerPosition.y)
    } else if (onStageMouseMove) {
      onStageMouseMove(e)
    }
  }, [isPanning, updatePan, onStageMouseMove])

  const handleMouseUp = useCallback((e: any) => {
    if (isPanning) {
      endPan()
    } else if (onStageMouseUp) {
      onStageMouseUp(e)
    }
  }, [isPanning, endPan, onStageMouseUp])

  // Handle click events
  const handleClick = useCallback((e: any) => {
    if (!isPanning && onStageClick) {
      onStageClick(e)
    }
  }, [isPanning, onStageClick])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            zoomIn()
            break
          case '-':
            e.preventDefault()
            zoomOut()
            break
          case '0':
            e.preventDefault()
            resetZoom()
            break
          case '1':
            e.preventDefault()
            fitToScreen()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, zoomIn, zoomOut, resetZoom])

  // Fit to screen
  const fitToScreen = useCallback(() => {
    setZoom(1, width / 2, height / 2)
  }, [setZoom, width, height])

  // Fit to content (placeholder - would need content bounds)
  const fitToContent = useCallback(() => {
    // This would calculate the bounds of all objects and fit them to screen
    // For now, just reset to 100%
    resetZoom()
  }, [resetZoom])

  // Touch event handlers
  const handleTouchStartEvent = useCallback((e: TouchEvent) => {
    handleTouchStart(e, startPan, () => {
      // Pinch start - could add visual feedback here
    })
  }, [handleTouchStart, startPan])

  const handleTouchMoveEvent = useCallback((e: TouchEvent) => {
    handleTouchMove(e, updatePan, (centerX, centerY, scale) => {
      // Pinch zoom
      const newScale = Math.max(
        finalConfig.limits.minScale,
        Math.min(zoomState.scale * scale, finalConfig.limits.maxScale)
      )
      setZoom(newScale, centerX, centerY)
    })
  }, [handleTouchMove, updatePan, setZoom, zoomState.scale, finalConfig.limits])

  const handleTouchEndEvent = useCallback((e: TouchEvent) => {
    handleTouchEnd(e, endPan, () => {
      // Pinch end
    })
  }, [handleTouchEnd, endPan])

  const handleTouchCancelEvent = useCallback((e: TouchEvent) => {
    handleTouchCancel(e, endPan, () => {
      // Pinch cancel
    })
  }, [handleTouchCancel, endPan])

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheelEvent, { passive: false })
      container.addEventListener('touchstart', handleTouchStartEvent, { passive: false })
      container.addEventListener('touchmove', handleTouchMoveEvent, { passive: false })
      container.addEventListener('touchend', handleTouchEndEvent, { passive: false })
      container.addEventListener('touchcancel', handleTouchCancelEvent, { passive: false })
      
      return () => {
        container.removeEventListener('wheel', handleWheelEvent)
        container.removeEventListener('touchstart', handleTouchStartEvent)
        container.removeEventListener('touchmove', handleTouchMoveEvent)
        container.removeEventListener('touchend', handleTouchEndEvent)
        container.removeEventListener('touchcancel', handleTouchCancelEvent)
      }
    }
  }, [handleWheelEvent, handleTouchStartEvent, handleTouchMoveEvent, handleTouchEndEvent, handleTouchCancelEvent])

  // Prevent context menu on right click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onContextMenu={handleContextMenu}
      style={{ 
        width: width,
        height: height,
        cursor: isPanning || isGesturing ? 'grabbing' : 'grab'
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoomState.scale}
        scaleY={zoomState.scale}
        x={zoomState.x}
        y={zoomState.y}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable={false} // We handle dragging manually for better control
      >
        <Layer>
          {children}
        </Layer>
      </Stage>

      {/* Zoom Controls */}
      {showZoomControls && (
        <ZoomControls
          zoomPercentage={getZoomPercentage()}
          isAtMinZoom={isAtMinZoom}
          isAtMaxZoom={isAtMaxZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFitToScreen={fitToScreen}
          onFitToContent={fitToContent}
          position={zoomControlsPosition}
        />
      )}

      {/* Zoom State Indicator (optional) */}
      {isPanning && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          Panning...
        </div>
      )}
    </div>
  )
}

export default ZoomableCanvas
