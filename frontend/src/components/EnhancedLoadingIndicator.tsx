/**
 * Enhanced loading indicator with detailed progress information
 */

import React from 'react'
import { Group, Circle, Rect, Text, Line } from 'react-konva'
import { CanvasObject } from '../types'
import { LoadingState } from '../services/loadingStateManager'

interface EnhancedLoadingIndicatorProps {
  object: CanvasObject
  loadingState: LoadingState
  showProgress?: boolean
  showMethod?: boolean
  showAttempt?: boolean
}

const EnhancedLoadingIndicator: React.FC<EnhancedLoadingIndicatorProps> = ({
  object,
  loadingState,
  showProgress = true,
  showMethod = true,
  showAttempt = true
}) => {
  const props = object.properties
  const x = props.x || 0
  const y = props.y || 0
  const width = props.width || 100
  // const height = props.height || 100

  // Calculate indicator position (top-right corner of object)
  const indicatorX = x + width - 25
  const indicatorY = y - 25

  // Animation pulse effect
  const pulseRadius = 10 + (Math.sin(Date.now() / 300) * 3)
  const pulseOpacity = 0.7 + (Math.sin(Date.now() / 200) * 0.3)

  // Method colors
  const methodColors = {
    socket: '#3b82f6',
    rest: '#f59e0b'
  }

  const methodColor = methodColors[loadingState.method] || '#6b7280'

  // Operation icons
  const getOperationIcon = (operation: LoadingState['operation']) => {
    switch (operation) {
      case 'position': return '↔'
      case 'resize': return '⤢'
      case 'properties': return '⚙'
      case 'create': return '+'
      case 'delete': return '×'
      default: return '●'
    }
  }

  return (
    <Group>
      {/* Main loading indicator */}
      <Circle
        x={indicatorX}
        y={indicatorY}
        radius={pulseRadius}
        fill={methodColor}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={pulseOpacity}
        shadowColor={methodColor}
        shadowBlur={6}
        shadowOpacity={0.4}
      />
      
      {/* Operation icon */}
      <Text
        x={indicatorX - 6}
        y={indicatorY - 6}
        text={getOperationIcon(loadingState.operation)}
        fontSize={12}
        fontFamily="Arial"
        fill="#ffffff"
        fontStyle="bold"
      />

      {/* Progress ring */}
      {showProgress && loadingState.progress !== undefined && (
        <Group>
          {/* Background ring */}
          <Circle
            x={indicatorX}
            y={indicatorY}
            radius={pulseRadius + 5}
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.3}
          />
          
          {/* Progress ring */}
          <Circle
            x={indicatorX}
            y={indicatorY}
            radius={pulseRadius + 5}
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.8}
            dash={[2, 2]}
            dashOffset={-loadingState.progress * 0.1}
          />
        </Group>
      )}

      {/* Method indicator */}
      {showMethod && (
        <Circle
          x={indicatorX + 15}
          y={indicatorY - 15}
          radius={6}
          fill={methodColor}
          stroke="#ffffff"
          strokeWidth={1}
        />
      )}

      {/* Method letter */}
      {showMethod && (
        <Text
          x={indicatorX + 12}
          y={indicatorY - 18}
          text={loadingState.method === 'socket' ? 'S' : 'R'}
          fontSize={8}
          fontFamily="Arial"
          fill="#ffffff"
          fontStyle="bold"
        />
      )}

      {/* Attempt indicator */}
      {showAttempt && loadingState.attempt > 1 && (
        <Group>
          <Circle
            x={indicatorX - 15}
            y={indicatorY - 15}
            radius={6}
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth={1}
          />
          <Text
            x={indicatorX - 18}
            y={indicatorY - 18}
            text={loadingState.attempt.toString()}
            fontSize={8}
            fontFamily="Arial"
            fill="#ffffff"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* Loading duration indicator */}
      {loadingState.startTime && (
        <Group>
          <Rect
            x={indicatorX - 20}
            y={indicatorY + 15}
            width={40}
            height={8}
            fill="#000000"
            opacity={0.6}
            cornerRadius={4}
          />
          <Text
            x={indicatorX - 15}
            y={indicatorY + 17}
            text={`${Math.round((Date.now() - loadingState.startTime) / 1000)}s`}
            fontSize={6}
            fontFamily="Arial"
            fill="#ffffff"
          />
        </Group>
      )}

      {/* Connection status indicator */}
      {loadingState.method === 'rest' && (
        <Group>
          <Line
            points={[indicatorX - 20, indicatorY + 25, indicatorX + 20, indicatorY + 25]}
            stroke="#f59e0b"
            strokeWidth={2}
            dash={[3, 3]}
          />
          <Text
            x={indicatorX - 15}
            y={indicatorY + 28}
            text="FALLBACK"
            fontSize={6}
            fontFamily="Arial"
            fill="#f59e0b"
            fontStyle="bold"
          />
        </Group>
      )}
    </Group>
  )
}

export default EnhancedLoadingIndicator
