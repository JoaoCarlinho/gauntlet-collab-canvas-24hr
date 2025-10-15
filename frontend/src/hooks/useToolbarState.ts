import { useState, useEffect, useCallback } from 'react'
import { DrawingTool, ToolbarPreferences, ToolbarState } from '../types/toolbar'
import { TOOLS, getToolById } from '../data/tools'

const DEFAULT_PREFERENCES: ToolbarPreferences = {
  position: { x: 20, y: 20 },
  isCollapsed: false,
  isVisible: true,
  size: 'medium',
  theme: 'light',
  showLabels: true,
  showShortcuts: false,
  toolOrder: TOOLS.map(tool => tool.id),
  visibleTools: TOOLS.map(tool => tool.id),
  defaultTool: 'select'
}

const STORAGE_KEY = 'floating-toolbar-preferences'

export const useToolbarState = () => {
  const [preferences, setPreferences] = useState<ToolbarPreferences>(DEFAULT_PREFERENCES)
  const [selectedTool, setSelectedTool] = useState<DrawingTool>(TOOLS[0])
  const [isVisible, setIsVisible] = useState(true)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
        
        // Set initial tool
        const initialTool = getToolById(parsed.defaultTool || DEFAULT_PREFERENCES.defaultTool)
        if (initialTool) {
          setSelectedTool(initialTool)
        }
      }
    } catch (error) {
      console.warn('Failed to load toolbar preferences:', error)
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save toolbar preferences:', error)
    }
  }, [preferences])

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<ToolbarPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [])

  // Select tool
  const selectTool = useCallback((tool: DrawingTool) => {
    setSelectedTool(tool)
  }, [])

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  // Update position
  const updatePosition = useCallback((position: { x: number; y: number }) => {
    updatePreferences({ position })
  }, [updatePreferences])

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    updatePreferences({ isCollapsed: !preferences.isCollapsed })
  }, [preferences.isCollapsed, updatePreferences])

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    setSelectedTool(TOOLS[0])
  }, [])

  // Get filtered tools based on preferences
  const getFilteredTools = useCallback((): DrawingTool[] => {
    return TOOLS.filter(tool => 
      preferences.visibleTools.includes(tool.id)
    ).sort((a, b) => {
      const aIndex = preferences.toolOrder.indexOf(a.id)
      const bIndex = preferences.toolOrder.indexOf(b.id)
      return aIndex - bIndex
    })
  }, [preferences.visibleTools, preferences.toolOrder])

  // Get toolbar state
  const getToolbarState = useCallback((): ToolbarState => {
    return {
      position: preferences.position,
      isCollapsed: preferences.isCollapsed,
      isVisible,
      selectedTool: selectedTool.id,
      toolCategories: Object.values(require('../types/toolbar').ToolCategory),
      userPreferences: preferences
    }
  }, [preferences, isVisible, selectedTool])

  return {
    preferences,
    selectedTool,
    isVisible,
    updatePreferences,
    selectTool,
    toggleVisibility,
    updatePosition,
    toggleCollapse,
    resetPreferences,
    getFilteredTools,
    getToolbarState
  }
}
