import React from 'react'
import { Rect } from 'react-konva'
import { CanvasObject } from '../types'

interface SelectionIndicatorProps {
  object: CanvasObject
  isSelected: boolean
  isHovered?: boolean
}

const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  object,
  isSelected,
  isHovered = false
}) => {
  if (!isSelected && !isHovered) return null

  const props = object.properties
  let bounds = { x: 0, y: 0, width: 0, height: 0 }

  // Calculate bounds based on object type
  switch (object.object_type) {
    case 'rectangle':
      bounds = { 
        x: props.x - 5, 
        y: props.y - 5, 
        width: props.width + 10, 
        height: props.height + 10 
      }
      break
    case 'circle':
      bounds = { 
        x: props.x - props.radius - 5, 
        y: props.y - props.radius - 5, 
        width: (props.radius * 2) + 10, 
        height: (props.radius * 2) + 10 
      }
      break
    case 'text':
      // Calculate text bounds (approximate)
      const textWidth = props.text.length * props.fontSize * 0.6
      const textHeight = props.fontSize * 1.2
      bounds = { 
        x: props.x - 5, 
        y: props.y - 5, 
        width: textWidth + 10, 
        height: textHeight + 10 
      }
      break
    default:
      return null
  }

  const strokeColor = isSelected ? '#3b82f6' : '#9ca3af'
  const strokeWidth = isSelected ? 2 : 1
  const dash = isSelected ? [5, 5] : [3, 3]

  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      dash={dash}
      fill="transparent"
    />
  )
}

export default SelectionIndicator
