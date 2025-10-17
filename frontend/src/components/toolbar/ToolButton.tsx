import React from 'react'
import { DrawingTool } from '../../types/toolbar'

interface ToolButtonProps {
  tool: DrawingTool
  isActive: boolean
  onClick: (tool: DrawingTool) => void
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  showShortcut?: boolean
  disabled?: boolean
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  isActive,
  onClick,
  size = 'medium',
  showLabel = true,
  showShortcut = false,
  disabled = false
}) => {
  const IconComponent = tool.icon

  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  }

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  const handleClick = () => {
    if (!disabled && tool.isEnabled) {
      onClick(tool)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || !tool.isEnabled}
        data-testid={`tool-${tool.id}`}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-lg border-2 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isActive 
            ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-md' 
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }
          ${disabled || !tool.isEnabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-sm'
          }
        `}
        title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut.toUpperCase()})` : ''}`}
        aria-label={`${tool.name} tool${tool.shortcut ? `, shortcut: ${tool.shortcut}` : ''}`}
        role="button"
        tabIndex={0}
      >
        <IconComponent className={iconSizeClasses[size]} />
      </button>
      
      {showLabel && (
        <div className="text-center">
          <div className={`
            text-xs font-medium
            ${isActive ? 'text-blue-700' : 'text-gray-600'}
            ${disabled || !tool.isEnabled ? 'opacity-50' : ''}
          `}>
            {tool.name}
          </div>
          {showShortcut && tool.shortcut && (
            <div className="text-xs text-gray-400 mt-0.5">
              {tool.shortcut.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolButton
