import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Minus, 
  ArrowRight, 
  Pen, 
  Paintbrush, 
  Highlighter, 
  Eraser, 
  StickyNote, 
  MessageSquare, 
  Eye, 
  Palette,
  Star,
  Heart,
  Diamond,
  SprayCan,
  Copy,
  Zap
} from 'lucide-react'
import { DrawingTool, ToolCategory, ToolProperties } from '../types/toolbar'

// Default tool properties
const defaultProperties: ToolProperties = {
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  strokeStyle: 'solid',
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Arial'
}

// Tool definitions
export const TOOLS: DrawingTool[] = [
  // SELECT CATEGORY
  {
    id: 'select',
    name: 'Select',
    icon: MousePointer2,
    category: ToolCategory.SELECT,
    shortcut: 'v',
    cursor: 'default',
    isActive: true,
    isEnabled: true,
    description: 'Select and manipulate objects',
    properties: defaultProperties
  },

  // SHAPES CATEGORY
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: Square,
    category: ToolCategory.SHAPES,
    shortcut: 'r',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw rectangles and squares',
    properties: defaultProperties
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: Circle,
    category: ToolCategory.SHAPES,
    shortcut: 'c',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw circles and ellipses',
    properties: defaultProperties
  },
  {
    id: 'line',
    name: 'Line',
    icon: Minus,
    category: ToolCategory.SHAPES,
    shortcut: 'l',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw straight lines',
    properties: defaultProperties
  },
  {
    id: 'arrow',
    name: 'Arrow',
    icon: ArrowRight,
    category: ToolCategory.SHAPES,
    shortcut: 'a',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw arrows and connectors',
    properties: defaultProperties
  },
  {
    id: 'star',
    name: 'Star',
    icon: Star,
    category: ToolCategory.SHAPES,
    shortcut: 's',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw star shapes',
    properties: defaultProperties
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: Heart,
    category: ToolCategory.SHAPES,
    shortcut: 'h',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw heart shapes',
    properties: defaultProperties
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: Diamond,
    category: ToolCategory.SHAPES,
    shortcut: 'd',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Draw diamond shapes',
    properties: defaultProperties
  },

  // DRAWING CATEGORY
  {
    id: 'pen',
    name: 'Pen',
    icon: Pen,
    category: ToolCategory.DRAWING,
    shortcut: 'p',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Freehand drawing with pen',
    properties: defaultProperties
  },
  {
    id: 'brush',
    name: 'Brush',
    icon: Paintbrush,
    category: ToolCategory.DRAWING,
    shortcut: 'b',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Paint with brush strokes',
    properties: defaultProperties
  },
  {
    id: 'highlighter',
    name: 'Highlighter',
    icon: Highlighter,
    category: ToolCategory.DRAWING,
    shortcut: 'g',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Highlight areas with semi-transparent color',
    properties: {
      ...defaultProperties,
      opacity: 0.3,
      strokeWidth: 8
    }
  },
  {
    id: 'eraser',
    name: 'Eraser',
    icon: Eraser,
    category: ToolCategory.DRAWING,
    shortcut: 'e',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Erase parts of objects',
    properties: defaultProperties
  },
  {
    id: 'spray',
    name: 'Spray Paint',
    icon: SprayCan,
    category: ToolCategory.DRAWING,
    shortcut: 'y',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Spray paint effect',
    properties: defaultProperties
  },

  // TEXT CATEGORY
  {
    id: 'text',
    name: 'Text',
    icon: Type,
    category: ToolCategory.TEXT,
    shortcut: 't',
    cursor: 'text',
    isActive: false,
    isEnabled: true,
    description: 'Add text to canvas',
    properties: defaultProperties
  },

  // ANNOTATION CATEGORY
  {
    id: 'sticky-note',
    name: 'Sticky Note',
    icon: StickyNote,
    category: ToolCategory.ANNOTATION,
    shortcut: 'n',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Add sticky note annotations',
    properties: {
      ...defaultProperties,
      fillColor: '#FFEB3B',
      strokeColor: '#F57F17'
    }
  },
  {
    id: 'comment',
    name: 'Comment',
    icon: MessageSquare,
    category: ToolCategory.ANNOTATION,
    shortcut: 'm',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Add comment annotations',
    properties: defaultProperties
  },

  // UTILITIES CATEGORY
  {
    id: 'eyedropper',
    name: 'Eyedropper',
    icon: Eye,
    category: ToolCategory.UTILITIES,
    shortcut: 'i',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Pick colors from canvas',
    properties: defaultProperties
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    icon: Palette,
    category: ToolCategory.UTILITIES,
    shortcut: 'o',
    cursor: 'default',
    isActive: false,
    isEnabled: true,
    description: 'Open color picker',
    properties: defaultProperties
  },
  {
    id: 'clone',
    name: 'Clone',
    icon: Copy,
    category: ToolCategory.UTILITIES,
    shortcut: 'k',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Clone objects',
    properties: defaultProperties
  },
  {
    id: 'gradient',
    name: 'Gradient',
    icon: Zap,
    category: ToolCategory.UTILITIES,
    shortcut: 'f',
    cursor: 'crosshair',
    isActive: false,
    isEnabled: true,
    description: 'Apply gradients',
    properties: defaultProperties
  }
]

// Tool categories with metadata
export const TOOL_CATEGORIES = [
  {
    id: ToolCategory.SELECT,
    name: 'Select',
    icon: MousePointer2,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.SELECT)
  },
  {
    id: ToolCategory.SHAPES,
    name: 'Shapes',
    icon: Square,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.SHAPES)
  },
  {
    id: ToolCategory.DRAWING,
    name: 'Drawing',
    icon: Pen,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.DRAWING)
  },
  {
    id: ToolCategory.TEXT,
    name: 'Text',
    icon: Type,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.TEXT)
  },
  {
    id: ToolCategory.ANNOTATION,
    name: 'Annotation',
    icon: StickyNote,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.ANNOTATION)
  },
  {
    id: ToolCategory.UTILITIES,
    name: 'Utilities',
    icon: Palette,
    tools: TOOLS.filter(tool => tool.category === ToolCategory.UTILITIES)
  }
]

// Keyboard shortcuts mapping
export const TOOL_SHORTCUTS: Record<string, string> = TOOLS.reduce((acc, tool) => {
  if (tool.shortcut) {
    acc[tool.shortcut] = tool.id
  }
  return acc
}, {} as Record<string, string>)

// Get tool by ID
export const getToolById = (id: string): DrawingTool | undefined => {
  return TOOLS.find(tool => tool.id === id)
}

// Get tools by category
export const getToolsByCategory = (category: ToolCategory): DrawingTool[] => {
  return TOOLS.filter(tool => tool.category === category)
}

// Get active tool
export const getActiveTool = (): DrawingTool | undefined => {
  return TOOLS.find(tool => tool.isActive)
}

// Set active tool
export const setActiveTool = (toolId: string): DrawingTool[] => {
  return TOOLS.map(tool => ({
    ...tool,
    isActive: tool.id === toolId
  }))
}
