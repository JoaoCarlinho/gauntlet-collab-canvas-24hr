/**
 * Success animation for completed updates
 */

import React, { useEffect, useState } from 'react'
import { Group, Circle, Text } from 'react-konva'

interface UpdateSuccessAnimationProps {
  x: number
  y: number
  onComplete: () => void
  duration?: number
}

const UpdateSuccessAnimation: React.FC<UpdateSuccessAnimationProps> = ({
  x,
  y,
  onComplete,
  duration = 1000
}) => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      
      setProgress(newProgress)
      
      if (newProgress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation complete
        setTimeout(() => {
          setIsVisible(false)
          onComplete()
        }, 200)
      }
    }
    
    requestAnimationFrame(animate)
  }, [duration, onComplete])

  if (!isVisible) return null

  // Animated properties
  const scale = 0.5 + (progress * 0.5) // Scale from 0.5 to 1
  const opacity = 1 - (progress * 0.3) // Fade out slightly
  const radius = 15 + (progress * 5) // Grow from 15 to 20

  return (
    <Group>
      {/* Success checkmark circle */}
      <Circle
        x={x}
        y={y}
        radius={radius}
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth={2}
        opacity={opacity}
        scaleX={scale}
        scaleY={scale}
        shadowColor="#10b981"
        shadowBlur={8}
        shadowOpacity={0.5}
      />
      
      {/* Checkmark */}
      <Text
        x={x - 6}
        y={y - 8}
        text="✓"
        fontSize={16}
        fontFamily="Arial"
        fill="#ffffff"
        fontStyle="bold"
        opacity={opacity}
        scaleX={scale}
        scaleY={scale}
      />
    </Group>
  )
}

export default UpdateSuccessAnimation
