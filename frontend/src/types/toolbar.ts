import { ReactComponent } from 'react'

export enum ToolCategory {
  SELECT = 'select',
  SHAPES = 'shapes',
  DRAWING = 'drawing',
  TEXT = 'text',
  ANNOTATION = 'annotation',
  UTILITIES = 'utilities'
}

export interface DrawingTool {
  id: string
  name: string
  icon: ReactComponent
  category: ToolCategory
  shortcut?: string
  cursor?: string
  isActive: boolean
  isEnabled: boolean
  description?: string
  properties?: ToolProperties
}

export interface ToolProperties {
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  strokeStyle?: 'solid' | 'dashed' | 'dotted'
  opacity?: number
  fontSize?: number
  fontFamily?: string
  [key: string]: any
}

export interface ToolbarState {
  position: { x: number; y: number }
  isCollapsed: boolean
  isVisible: boolean
  selectedTool: string
  toolCategories: ToolCategory[]
  userPreferences: ToolbarPreferences
}

export interface ToolbarPreferences {
  position: { x: number; y: number }
  isCollapsed: boolean
  isVisible: boolean
  size: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'auto'
  showLabels: boolean
  showShortcuts: boolean
  toolOrder: string[]
  visibleTools: string[]
  defaultTool: string
}

export interface ToolConfig {
  id: string
  isEnabled: boolean
  isVisible: boolean
  defaultProperties: Record<string, any>
  shortcuts: string[]
  customIcon?: string
}

export interface FloatingToolbarProps {
  position: { x: number; y: number }
  isVisible: boolean
  selectedTool: DrawingTool
  onToolSelect: (tool: DrawingTool) => void
  onPositionChange: (position: { x: number; y: number }) => void
  onVisibilityToggle: () => void
  onCollapseToggle: () => void
  tools: DrawingTool[]
  preferences: ToolbarPreferences
  onPreferencesChange: (preferences: Partial<ToolbarPreferences>) => void
}
