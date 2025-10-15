import React from 'react'
import { Group, Line, Circle, RegularPolygon } from 'react-konva'
import { ToolProperties } from '../types/toolbar'

interface PointerIndicatorProps {
  toolId: string
  position: { x: number; y: number }
  isVisible: boolean
  toolProperties: ToolProperties
  startPosition?: { x: number; y: number } // For line/arrow tools
}

const PointerIndicator: React.FC<PointerIndicatorProps> = ({
  toolId,
  position,
  isVisible,
  toolProperties,
  startPosition
}) => {
  if (!isVisible) return null

  const strokeColor = toolProperties.strokeColor || '#3b82f6'
  const strokeWidth = toolProperties.strokeWidth || 2
  const opacity = 0.4

  // Common props for all indicators
  const commonProps = {
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity,
    dash: [5, 5], // Dashed line for preview effect
    listening: false // Don't interfere with mouse events
  }

  const renderShapeIndicator = () => {
    const size = 40
    const halfSize = size / 2

    switch (toolId) {
      case 'heart':
        return (
          <Group x={position.x} y={position.y}>
            {/* Heart shape using circles and triangle */}
            <Circle
              x={-halfSize * 0.3}
              y={-halfSize * 0.2}
              radius={halfSize * 0.4}
              fill="transparent"
              {...commonProps}
            />
            <Circle
              x={halfSize * 0.3}
              y={-halfSize * 0.2}
              radius={halfSize * 0.4}
              fill="transparent"
              {...commonProps}
            />
            <RegularPolygon
              x={0}
              y={halfSize * 0.3}
              sides={3}
              radius={halfSize * 0.6}
              rotation={180}
              fill="transparent"
              {...commonProps}
            />
          </Group>
        )

      case 'star':
        return (
          <Group x={position.x} y={position.y}>
            <RegularPolygon
              x={0}
              y={0}
              sides={5}
              radius={halfSize}
              fill="transparent"
              {...commonProps}
            />
          </Group>
        )

      case 'diamond':
        return (
          <Group x={position.x} y={position.y}>
            <RegularPolygon
              x={0}
              y={0}
              sides={4}
              radius={halfSize}
              rotation={45}
              fill="transparent"
              {...commonProps}
            />
          </Group>
        )

      default:
        return null
    }
  }

  const renderLineIndicator = () => {
    if (!startPosition) return null

    const dx = position.x - startPosition.x
    const dy = position.y - startPosition.y

    switch (toolId) {
      case 'line':
        return (
          <Line
            x={startPosition.x}
            y={startPosition.y}
            points={[0, 0, dx, dy]}
            {...commonProps}
          />
        )

      case 'arrow':
        return (
          <Group>
            {/* Main line */}
            <Line
              x={startPosition.x}
              y={startPosition.y}
              points={[0, 0, dx, dy]}
              {...commonProps}
            />
            {/* Arrow head */}
            {Math.abs(dx) > 5 || Math.abs(dy) > 5 ? (
              <Group
                x={position.x}
                y={position.y}
                rotation={Math.atan2(dy, dx) * (180 / Math.PI)}
              >
                <Line
                  x={0}
                  y={0}
                  points={[-15, -8, 0, 0, -15, 8]}
                  {...commonProps}
                />
              </Group>
            ) : null}
          </Group>
        )

      default:
        return null
    }
  }

  // Determine which type of indicator to render
  if (['heart', 'star', 'diamond'].includes(toolId)) {
    return renderShapeIndicator()
  } else if (['line', 'arrow'].includes(toolId)) {
    return renderLineIndicator()
  }

  return null
}

export default PointerIndicator
