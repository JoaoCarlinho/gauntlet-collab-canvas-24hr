import { useEffect, useCallback } from 'react'
import { DrawingTool } from '../types/toolbar'
import { TOOL_SHORTCUTS, getToolById } from '../data/tools'

interface UseToolShortcutsProps {
  onToolSelect: (tool: DrawingTool) => void
  enabled?: boolean
}

export const useToolShortcuts = ({ onToolSelect, enabled = true }: UseToolShortcutsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return
    }

    // Check for modifier keys (Ctrl, Alt, Shift)
    if (e.ctrlKey || e.altKey || e.shiftKey) {
      return
    }

    const key = e.key.toLowerCase()
    const toolId = TOOL_SHORTCUTS[key]

    if (toolId) {
      e.preventDefault()
      const tool = getToolById(toolId)
      if (tool && tool.isEnabled) {
        onToolSelect(tool)
      }
    }
  }, [onToolSelect, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, enabled])

  return {
    shortcuts: TOOL_SHORTCUTS
  }
}
