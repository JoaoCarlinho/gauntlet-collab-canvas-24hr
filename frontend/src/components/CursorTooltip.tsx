import React from 'react'
import { CursorData } from '../types'

interface CursorTooltipProps {
  cursor: CursorData
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
}

const CursorTooltip: React.FC<CursorTooltipProps> = ({
  cursor,
  position,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null

  // Get user initials from name
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get user color based on user ID
  const getUserColor = (userId: string): string => {
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Yellow
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6b7280'  // Gray
    ]
    
    // Simple hash function to get consistent color for user
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const userColor = getUserColor(cursor.user_id)
  const userInitials = getUserInitials(cursor.user_name)

  // Calculate tooltip position to avoid screen edges
  const getTooltipPosition = () => {
    const tooltipWidth = 200 // Approximate tooltip width
    const tooltipHeight = 60 // Approximate tooltip height
    const padding = 10

    let x = position.x + 15
    let y = position.y - 40

    // Adjust horizontal position if too close to right edge
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = position.x - tooltipWidth - 15
    }

    // Adjust vertical position if too close to top edge
    if (y < padding) {
      y = position.y + 20
    }

    return { x, y }
  }

  const tooltipPosition = getTooltipPosition()

  return (
    <div
      className={`fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-200 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translateX(-50%)'
      }}
      onMouseLeave={onClose}
    >
      <div className="flex items-center space-x-2">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: userColor }}
        >
          {userInitials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{cursor.user_name}</span>
          <span className="text-xs text-gray-300">Collaborating</span>
        </div>
      </div>
      
      {/* Tooltip arrow */}
      <div 
        className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
        style={{
          borderTopColor: '#1f2937',
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  )
}

export default CursorTooltip
