import React, { useState, useRef, useEffect } from 'react'
import { Text, Rect, Group } from 'react-konva'
import { CanvasObject } from '../types'

interface EditableTextProps {
  object: CanvasObject
  isSelected: boolean
  isEditing: boolean
  onStartEdit: (objectId: string) => void
  onEndEdit: (objectId: string, newText: string) => void
  onSelect: (objectId: string) => void
  onUpdatePosition: (objectId: string, x: number, y: number) => void
  selectedTool: string
}

const EditableText: React.FC<EditableTextProps> = ({
  object,
  isSelected,
  isEditing,
  onStartEdit,
  onEndEdit,
  onSelect,
  onUpdatePosition,
  selectedTool
}) => {
  const [text, setText] = useState(object.properties.text)
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<any>(null)

  // Update text when object properties change
  useEffect(() => {
    setText(object.properties.text)
  }, [object.properties.text])

  const handleDoubleClick = () => {
    if (!isEditing && selectedTool === 'select') {
      onStartEdit(object.id)
    }
  }

  const handleClick = () => {
    if (selectedTool === 'select') {
      onSelect(object.id)
    }
  }

  const handleDragEnd = (e: any) => {
    if (selectedTool === 'select' && !isEditing) {
      onUpdatePosition(object.id, e.target.x(), e.target.y())
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onEndEdit(object.id, text)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setText(object.properties.text) // Reset to original text
        onEndEdit(object.id, object.properties.text)
      }
    }
  }

  // Add keyboard event listeners when editing
  useEffect(() => {
    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditing, text])

  // Calculate text bounds for selection indicator
  const getTextBounds = () => {
    const props = object.properties
    const textWidth = props.text.length * props.fontSize * 0.6
    const textHeight = props.fontSize * 1.2
    return {
      x: props.x - 5,
      y: props.y - 5,
      width: textWidth + 10,
      height: textHeight + 10
    }
  }

  const bounds = getTextBounds()

  return (
    <Group>
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          fill="transparent"
        />
      )}

      {/* Hover indicator */}
      {isHovered && !isSelected && selectedTool === 'select' && (
        <Rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          stroke="#9ca3af"
          strokeWidth={1}
          dash={[3, 3]}
          fill="transparent"
        />
      )}
      
      {/* Text component */}
      <Text
        ref={textRef}
        x={object.properties.x}
        y={object.properties.y}
        text={text}
        fontSize={object.properties.fontSize}
        fill={object.properties.fill}
        fontFamily={object.properties.fontFamily}
        draggable={!isEditing && selectedTool === 'select'}
        onDblClick={handleDoubleClick}
        onClick={handleClick}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // Visual feedback for editing state
        opacity={isEditing ? 0.8 : 1}
        // Cursor changes
        style={{ cursor: isEditing ? 'text' : (selectedTool === 'select' ? 'move' : 'default') }}
      />
    </Group>
  )
}

export default EditableText
