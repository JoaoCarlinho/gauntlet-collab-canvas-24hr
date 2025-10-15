import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { DrawingTool, ToolCategory } from '../../types/toolbar'
import ToolButton from './ToolButton'

interface ToolGroupProps {
  category: ToolCategory
  name: string
  icon: React.ComponentType<any>
  tools: DrawingTool[]
  activeToolId: string
  onToolSelect: (tool: DrawingTool) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  size?: 'small' | 'medium' | 'large'
  showLabels?: boolean
  showShortcuts?: boolean
}

const ToolGroup: React.FC<ToolGroupProps> = ({
  category,
  name,
  icon: IconComponent,
  tools,
  activeToolId,
  onToolSelect,
  isCollapsed = false,
  onToggleCollapse,
  size = 'medium',
  showLabels = true,
  showShortcuts = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    onToggleCollapse?.()
  }

  const enabledTools = tools.filter(tool => tool.isEnabled)

  if (enabledTools.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Group Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg"
        aria-expanded={isExpanded}
        aria-controls={`tool-group-${category}`}
      >
        <div className="flex items-center space-x-2">
          <IconComponent className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{name}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {enabledTools.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div
          id={`tool-group-${category}`}
          className="p-3 border-t border-gray-100"
        >
          <div className="grid grid-cols-2 gap-2">
            {enabledTools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={tool.id === activeToolId}
                onClick={onToolSelect}
                size={size}
                showLabel={showLabels}
                showShortcut={showShortcuts}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolGroup
