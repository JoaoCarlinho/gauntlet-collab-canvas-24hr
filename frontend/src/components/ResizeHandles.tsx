import React, { useState } from 'react'
import { Rect, Group } from 'react-konva'
import { CanvasObject } from '../types'
import { CursorState, getCursorManager } from '../utils/cursorManager'

interface ResizeHandlesProps {
  object: CanvasObject
  isSelected: boolean
  onResize: (objectId: string, newProperties: any) => void
  onCursorChange?: (cursor: CursorState) => void
  onCursorReset?: () => void
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  object,
  isSelected,
  onResize,
  onCursorChange,
  onCursorReset
}) => {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)
  const cursorManager = getCursorManager()

  if (!isSelected) return null

  const props = object.properties
  const handleSize = 8
  const handleOffset = handleSize / 2

  const getHandles = () => {
    switch (object.object_type) {
      case 'rectangle':
        return [
          // Corner handles
          { x: props.x - handleOffset, y: props.y - handleOffset, cursor: 'nw-resize', type: 'nw' },
          { x: props.x + props.width - handleOffset, y: props.y - handleOffset, cursor: 'ne-resize', type: 'ne' },
          { x: props.x - handleOffset, y: props.y + props.height - handleOffset, cursor: 'sw-resize', type: 'sw' },
          { x: props.x + props.width - handleOffset, y: props.y + props.height - handleOffset, cursor: 'se-resize', type: 'se' },
          // Edge handles
          { x: props.x + props.width/2 - handleOffset, y: props.y - handleOffset, cursor: 'n-resize', type: 'n' },
          { x: props.x + props.width/2 - handleOffset, y: props.y + props.height - handleOffset, cursor: 's-resize', type: 's' },
          { x: props.x - handleOffset, y: props.y + props.height/2 - handleOffset, cursor: 'w-resize', type: 'w' },
          { x: props.x + props.width - handleOffset, y: props.y + props.height/2 - handleOffset, cursor: 'e-resize', type: 'e' }
        ]
      case 'circle':
        return [
          // 8 handles around the circle
          { x: props.x - handleOffset, y: props.y - props.radius - handleOffset, cursor: 'n-resize', type: 'n' },
          { x: props.x + props.radius - handleOffset, y: props.y - handleOffset, cursor: 'e-resize', type: 'e' },
          { x: props.x - handleOffset, y: props.y + props.radius - handleOffset, cursor: 's-resize', type: 's' },
          { x: props.x - props.radius - handleOffset, y: props.y - handleOffset, cursor: 'w-resize', type: 'w' },
          // Diagonal handles
          { x: props.x + props.radius * 0.707 - handleOffset, y: props.y - props.radius * 0.707 - handleOffset, cursor: 'ne-resize', type: 'ne' },
          { x: props.x + props.radius * 0.707 - handleOffset, y: props.y + props.radius * 0.707 - handleOffset, cursor: 'se-resize', type: 'se' },
          { x: props.x - props.radius * 0.707 - handleOffset, y: props.y + props.radius * 0.707 - handleOffset, cursor: 'sw-resize', type: 'sw' },
          { x: props.x - props.radius * 0.707 - handleOffset, y: props.y - props.radius * 0.707 - handleOffset, cursor: 'nw-resize', type: 'nw' }
        ]
      case 'text':
        // Text resizing handles (font size adjustment)
        const textWidth = props.text.length * props.fontSize * 0.6
        const textHeight = props.fontSize * 1.2
        return [
          { x: props.x + textWidth - handleOffset, y: props.y - handleOffset, cursor: 'e-resize', type: 'e' },
          { x: props.x + textWidth - handleOffset, y: props.y + textHeight - handleOffset, cursor: 'e-resize', type: 'e' }
        ]
      case 'heart':
      case 'star':
      case 'diamond':
        // Shape objects with 8 handles (same as rectangle)
        return [
          // Corner handles
          { x: props.x - handleOffset, y: props.y - handleOffset, cursor: 'nw-resize', type: 'nw' },
          { x: props.x + props.width - handleOffset, y: props.y - handleOffset, cursor: 'ne-resize', type: 'ne' },
          { x: props.x - handleOffset, y: props.y + props.height - handleOffset, cursor: 'sw-resize', type: 'sw' },
          { x: props.x + props.width - handleOffset, y: props.y + props.height - handleOffset, cursor: 'se-resize', type: 'se' },
          // Edge handles
          { x: props.x + props.width/2 - handleOffset, y: props.y - handleOffset, cursor: 'n-resize', type: 'n' },
          { x: props.x + props.width/2 - handleOffset, y: props.y + props.height - handleOffset, cursor: 's-resize', type: 's' },
          { x: props.x - handleOffset, y: props.y + props.height/2 - handleOffset, cursor: 'w-resize', type: 'w' },
          { x: props.x + props.width - handleOffset, y: props.y + props.height/2 - handleOffset, cursor: 'e-resize', type: 'e' }
        ]
      case 'line':
      case 'arrow':
        // Line objects with start and end point handles
        const startX = props.x
        const startY = props.y
        const endX = props.x + (props.points?.[2] || 100)
        const endY = props.y + (props.points?.[3] || 0)
        return [
          { x: startX - handleOffset, y: startY - handleOffset, cursor: 'move', type: 'start' },
          { x: endX - handleOffset, y: endY - handleOffset, cursor: 'move', type: 'end' }
        ]
      default:
        return []
    }
  }

  const handleResize = (e: any, handleType: string) => {
    const newProperties = { ...props }
    const deltaX = e.target.x() - (e.target.attrs.x || 0)
    const deltaY = e.target.y() - (e.target.attrs.y || 0)

    switch (object.object_type) {
      case 'rectangle':
        handleRectangleResize(newProperties, handleType, deltaX, deltaY)
        break
      case 'circle':
        handleCircleResize(newProperties, handleType, deltaX, deltaY)
        break
      case 'text':
        handleTextResize(newProperties, handleType, deltaX, deltaY)
        break
      case 'heart':
      case 'star':
      case 'diamond':
        handleShapeResize(newProperties, handleType, deltaX, deltaY)
        break
      case 'line':
      case 'arrow':
        handleLineResize(newProperties, handleType, deltaX, deltaY)
        break
    }

    // Update object in real-time
    onResize(object.id, newProperties)
  }

  const handleRectangleResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
    const minSize = 10

    switch (handleType) {
      case 'nw': // Top-left
        props.x += deltaX
        props.y += deltaY
        props.width = Math.max(minSize, props.width - deltaX)
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 'ne': // Top-right
        props.y += deltaY
        props.width = Math.max(minSize, props.width + deltaX)
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 'sw': // Bottom-left
        props.x += deltaX
        props.width = Math.max(minSize, props.width - deltaX)
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'se': // Bottom-right
        props.width = Math.max(minSize, props.width + deltaX)
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'n': // Top edge
        props.y += deltaY
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 's': // Bottom edge
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'w': // Left edge
        props.x += deltaX
        props.width = Math.max(minSize, props.width - deltaX)
        break
      case 'e': // Right edge
        props.width = Math.max(minSize, props.width + deltaX)
        break
    }
  }

  const handleCircleResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
    const minRadius = 10
    let newRadius = props.radius

    switch (handleType) {
      case 'n':
        newRadius = Math.max(minRadius, props.radius - deltaY)
        break
      case 's':
        newRadius = Math.max(minRadius, props.radius + deltaY)
        break
      case 'e':
        newRadius = Math.max(minRadius, props.radius + deltaX)
        break
      case 'w':
        newRadius = Math.max(minRadius, props.radius - deltaX)
        break
      case 'ne':
      case 'se':
      case 'sw':
      case 'nw':
        // For diagonal handles, calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        newRadius = Math.max(minRadius, props.radius + distance * 0.5)
        break
    }

    props.radius = newRadius
  }

  const handleTextResize = (props: any, handleType: string, deltaX: number, _deltaY: number) => {
    if (handleType === 'e') {
      // Adjust font size based on horizontal resize
      const newFontSize = Math.max(8, Math.min(72, props.fontSize + deltaX * 0.3))
      props.fontSize = newFontSize
    }
  }

  const handleShapeResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
    const minSize = 20

    switch (handleType) {
      case 'nw': // Top-left
        props.x += deltaX
        props.y += deltaY
        props.width = Math.max(minSize, props.width - deltaX)
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 'ne': // Top-right
        props.y += deltaY
        props.width = Math.max(minSize, props.width + deltaX)
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 'sw': // Bottom-left
        props.x += deltaX
        props.width = Math.max(minSize, props.width - deltaX)
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'se': // Bottom-right
        props.width = Math.max(minSize, props.width + deltaX)
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'n': // Top edge
        props.y += deltaY
        props.height = Math.max(minSize, props.height - deltaY)
        break
      case 's': // Bottom edge
        props.height = Math.max(minSize, props.height + deltaY)
        break
      case 'w': // Left edge
        props.x += deltaX
        props.width = Math.max(minSize, props.width - deltaX)
        break
      case 'e': // Right edge
        props.width = Math.max(minSize, props.width + deltaX)
        break
    }
  }

  const handleLineResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
    if (!props.points || props.points.length < 4) {
      props.points = [0, 0, 100, 0]
    }

    switch (handleType) {
      case 'start': // Start point
        props.points[0] += deltaX
        props.points[1] += deltaY
        break
      case 'end': // End point
        props.points[2] += deltaX
        props.points[3] += deltaY
        break
    }
  }

  const handleMouseEnter = (handleType: string) => {
    setHoveredHandle(handleType)
    const cursor = cursorManager.getCursorForHandle(handleType)
    cursorManager.setCursor(cursor)
    onCursorChange?.(cursor)
  }

  const handleMouseLeave = () => {
    setHoveredHandle(null)
    cursorManager.resetCursor()
    onCursorReset?.()
  }

  const getHandleStyle = (handleType: string) => {
    const isHovered = hoveredHandle === handleType
    return {
      fill: isHovered ? '#1d4ed8' : '#3b82f6',
      stroke: '#fff',
      strokeWidth: 1,
      opacity: isHovered ? 1 : 0.8
    }
  }

  return (
    <Group>
      {getHandles().map((handle, index) => {
        const style = getHandleStyle(handle.type)
        return (
          <Rect
            key={index}
            x={handle.x}
            y={handle.y}
            width={handleSize}
            height={handleSize}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            opacity={style.opacity}
            draggable={true}
            onDragMove={(e) => handleResize(e, handle.type)}
            onDragEnd={(e) => handleResize(e, handle.type)}
            onMouseEnter={() => handleMouseEnter(handle.type)}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: handle.cursor }}
          />
        )
      })}
    </Group>
  )
}

export default ResizeHandles
