import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Move, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Settings
} from 'lucide-react'
import { FloatingToolbarProps, DrawingTool } from '../../types/toolbar'
import { TOOL_CATEGORIES } from '../../data/tools'
import ToolGroup from './ToolGroup'

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  position,
  isVisible,
  selectedTool,
  onToolSelect,
  onPositionChange,
  onVisibilityToggle,
  onCollapseToggle,
  tools,
  preferences,
  onPreferencesChange
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(preferences.isCollapsed)
  const [showSettings, setShowSettings] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
      onPositionChange(newPosition)
    }
  }, [isDragging, dragStart, onPositionChange])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      // Save position to preferences
      onPreferencesChange({ position })
    }
  }, [isDragging, position, onPreferencesChange])

  // Handle collapse toggle
  const handleCollapseToggle = useCallback(() => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapseToggle()
    onPreferencesChange({ isCollapsed: newCollapsed })
  }, [isCollapsed, onCollapseToggle, onPreferencesChange])

  // Handle tool selection
  const handleToolSelect = useCallback((tool: DrawingTool) => {
    onToolSelect(tool)
  }, [onToolSelect])

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Constrain position to viewport
  useEffect(() => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      let newX = position.x
      let newY = position.y

      // Constrain to viewport bounds
      if (newX < 0) newX = 0
      if (newY < 0) newY = 0
      if (newX + rect.width > viewport.width) newX = viewport.width - rect.width
      if (newY + rect.height > viewport.height) newY = viewport.height - rect.height

      if (newX !== position.x || newY !== position.y) {
        onPositionChange({ x: newX, y: newY })
      }
    }
  }, [position, onPositionChange])

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={toolbarRef}
      className={`
        fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200
        transition-all duration-300 ease-in-out
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${isCollapsed ? 'w-12' : 'w-48'}
      `}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Toolbar Header */}
      <div 
        className="flex items-center justify-between p-2 border-b border-gray-100"
        data-drag-handle
      >
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            {isCollapsed ? '' : 'Drawing Tools'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCollapseToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            title="Toolbar settings"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          
          <button
            onClick={onVisibilityToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            title="Hide toolbar"
          >
            <EyeOff className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Toolbar Content */}
      {!isCollapsed && (
        <div className="p-3 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {TOOL_CATEGORIES.map((category) => {
              const categoryTools = tools.filter(tool => tool.category === category.id)
              if (categoryTools.length === 0) return null

              return (
                <ToolGroup
                  key={category.id}
                  category={category.id}
                  name={category.name}
                  icon={category.icon}
                  tools={categoryTools}
                  activeToolId={selectedTool.id}
                  onToolSelect={handleToolSelect}
                  size={preferences.size}
                  showLabels={preferences.showLabels}
                  showShortcuts={preferences.showShortcuts}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="p-2">
          <div className="space-y-2">
            {TOOL_CATEGORIES.slice(0, 3).map((category) => {
              const categoryTools = tools.filter(tool => tool.category === category.id)
              const activeTool = categoryTools.find(tool => tool.id === selectedTool.id)
              
              if (!activeTool) return null

              return (
                <button
                  key={category.id}
                  onClick={() => handleToolSelect(activeTool)}
                  className={`
                    w-full p-2 rounded transition-colors duration-200
                    ${activeTool.id === selectedTool.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100 text-gray-600'
                    }
                  `}
                  title={activeTool.name}
                >
                  <activeTool.icon className="w-4 h-4 mx-auto" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && !isCollapsed && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toolbar Size
              </label>
              <select
                value={preferences.size}
                onChange={(e) => onPreferencesChange({ 
                  size: e.target.value as 'small' | 'medium' | 'large' 
                })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showLabels"
                checked={preferences.showLabels}
                onChange={(e) => onPreferencesChange({ showLabels: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="showLabels" className="text-sm text-gray-700">
                Show tool labels
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showShortcuts"
                checked={preferences.showShortcuts}
                onChange={(e) => onPreferencesChange({ showShortcuts: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="showShortcuts" className="text-sm text-gray-700">
                Show keyboard shortcuts
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatingToolbar
