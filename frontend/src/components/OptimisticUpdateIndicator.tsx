/**
 * Visual indicator for optimistic updates and loading states
 */

import React from 'react'
import { Group, Circle, Rect, Text } from 'react-konva'
import { CanvasObject } from '../types'

interface OptimisticUpdateIndicatorProps {
  object: CanvasObject
  isUpdating: boolean
  updateMethod?: 'socket' | 'rest'
  attempt?: number
  showProgress?: boolean
}

const OptimisticUpdateIndicator: React.FC<OptimisticUpdateIndicatorProps> = ({
  object,
  isUpdating,
  updateMethod = 'socket',
  attempt = 1,
  showProgress = true
}) => {
  if (!isUpdating) return null

  const props = object.properties
  const x = props.x || 0
  const y = props.y || 0
  const width = props.width || 100
  const height = props.height || 100

  // Calculate indicator position (top-right corner of object)
  const indicatorX = x + width - 20
  const indicatorY = y - 20

  // Animation pulse effect
  const pulseRadius = 8 + (Math.sin(Date.now() / 200) * 2)

  return (
    <Group>
      {/* Loading indicator circle */}
      <Circle
        x={indicatorX}
        y={indicatorY}
        radius={pulseRadius}
        fill={updateMethod === 'socket' ? '#3b82f6' : '#f59e0b'}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={0.9}
        shadowColor="#000000"
        shadowBlur={4}
        shadowOpacity={0.3}
      />
      
      {/* Method indicator */}
      <Text
        x={indicatorX - 4}
        y={indicatorY - 4}
        text={updateMethod === 'socket' ? 'S' : 'R'}
        fontSize={10}
        fontFamily="Arial"
        fill="#ffffff"
        fontStyle="bold"
      />

      {/* Progress indicator */}
      {showProgress && attempt > 1 && (
        <Circle
          x={indicatorX + 12}
          y={indicatorY - 12}
          radius={6}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1}
        />
      )}

      {/* Attempt number */}
      {showProgress && attempt > 1 && (
        <Text
          x={indicatorX + 9}
          y={indicatorY - 15}
          text={attempt.toString()}
          fontSize={8}
          fontFamily="Arial"
          fill="#ffffff"
          fontStyle="bold"
        />
      )}
    </Group>
  )
}

export default OptimisticUpdateIndicator
