/**
 * CursorManager - Manages cursor states and changes for the canvas
 * Provides centralized cursor management for resize handles, object interactions, and tool states
 */

export enum CursorState {
  DEFAULT = 'default',
  MOVE = 'move',
  NW_RESIZE = 'nw-resize',
  NE_RESIZE = 'ne-resize',
  SW_RESIZE = 'sw-resize',
  SE_RESIZE = 'se-resize',
  N_RESIZE = 'ns-resize',
  S_RESIZE = 'ns-resize',
  E_RESIZE = 'ew-resize',
  W_RESIZE = 'ew-resize',
  CROSSHAIR = 'crosshair',
  GRAB = 'grab',
  GRABBING = 'grabbing',
  POINTER = 'pointer',
  TEXT = 'text',
  NOT_ALLOWED = 'not-allowed'
}

export interface CursorManagerConfig {
  canvasElement?: HTMLElement
  enableSmoothTransitions?: boolean
  transitionDuration?: number
}

class CursorManager {
  private currentCursor: CursorState = CursorState.DEFAULT
  private canvasElement: HTMLElement | null = null
  private config: CursorManagerConfig
  private isTransitioning: boolean = false

  constructor(config: CursorManagerConfig = {}) {
    this.config = {
      enableSmoothTransitions: true,
      transitionDuration: 150,
      ...config
    }
    this.canvasElement = config.canvasElement || null
  }

  /**
   * Set the cursor for the canvas element
   */
  setCursor(cursor: CursorState): void {
    if (this.currentCursor === cursor || this.isTransitioning) {
      return
    }

    this.currentCursor = cursor
    this.applyCursor(cursor)
  }

  /**
   * Reset cursor to default state
   */
  resetCursor(): void {
    this.setCursor(CursorState.DEFAULT)
  }

  /**
   * Get the current cursor state
   */
  getCurrentCursor(): CursorState {
    return this.currentCursor
  }

  /**
   * Check if the current cursor is a resize cursor
   */
  isResizeCursor(cursor?: CursorState): boolean {
    const checkCursor = cursor || this.currentCursor
    return [
      CursorState.NW_RESIZE,
      CursorState.NE_RESIZE,
      CursorState.SW_RESIZE,
      CursorState.SE_RESIZE,
      CursorState.N_RESIZE,
      CursorState.S_RESIZE,
      CursorState.E_RESIZE,
      CursorState.W_RESIZE
    ].includes(checkCursor)
  }

  /**
   * Check if the current cursor is a move cursor
   */
  isMoveCursor(cursor?: CursorState): boolean {
    const checkCursor = cursor || this.currentCursor
    return checkCursor === CursorState.MOVE || checkCursor === CursorState.GRAB || checkCursor === CursorState.GRABBING
  }

  /**
   * Get cursor for a specific resize handle type
   */
  getCursorForHandle(handleType: string): CursorState {
    switch (handleType) {
      case 'nw':
        return CursorState.NW_RESIZE
      case 'ne':
        return CursorState.NE_RESIZE
      case 'sw':
        return CursorState.SW_RESIZE
      case 'se':
        return CursorState.SE_RESIZE
      case 'n':
        return CursorState.N_RESIZE
      case 's':
        return CursorState.S_RESIZE
      case 'e':
        return CursorState.E_RESIZE
      case 'w':
        return CursorState.W_RESIZE
      default:
        return CursorState.DEFAULT
    }
  }

  /**
   * Get cursor for a specific tool
   */
  getCursorForTool(toolId: string): CursorState {
    switch (toolId) {
      case 'select':
        return CursorState.DEFAULT
      case 'pen':
      case 'brush':
      case 'line':
      case 'arrow':
      case 'rectangle':
      case 'circle':
      case 'heart':
      case 'star':
      case 'diamond':
        return CursorState.CROSSHAIR
      case 'text':
        return CursorState.TEXT
      case 'eraser':
        return CursorState.NOT_ALLOWED
      default:
        return CursorState.DEFAULT
    }
  }

  /**
   * Set canvas element for cursor management
   */
  setCanvasElement(element: HTMLElement): void {
    this.canvasElement = element
  }

  /**
   * Apply cursor to the canvas element
   */
  private applyCursor(cursor: CursorState): void {
    if (!this.canvasElement) {
      return
    }

    if (this.config.enableSmoothTransitions && this.config.transitionDuration) {
      this.isTransitioning = true
      this.canvasElement.style.cursor = cursor
      this.canvasElement.style.transition = `cursor ${this.config.transitionDuration}ms ease-in-out`
      
      setTimeout(() => {
        this.isTransitioning = false
        this.canvasElement!.style.transition = ''
      }, this.config.transitionDuration)
    } else {
      this.canvasElement.style.cursor = cursor
    }
  }

  /**
   * Handle mouse enter event for resize handles
   */
  handleResizeHandleEnter(handleType: string): void {
    const cursor = this.getCursorForHandle(handleType)
    this.setCursor(cursor)
  }

  /**
   * Handle mouse leave event for resize handles
   */
  handleResizeHandleLeave(): void {
    // Only reset if we're not currently resizing
    if (!this.isResizeCursor()) {
      this.resetCursor()
    }
  }

  /**
   * Handle object hover for move cursor
   */
  handleObjectHover(isHovered: boolean, isSelected: boolean): void {
    if (isHovered && isSelected) {
      this.setCursor(CursorState.MOVE)
    } else if (isHovered) {
      this.setCursor(CursorState.POINTER)
    } else {
      this.resetCursor()
    }
  }

  /**
   * Handle tool selection cursor change
   */
  handleToolSelection(toolId: string): void {
    const cursor = this.getCursorForTool(toolId)
    this.setCursor(cursor)
  }

  /**
   * Handle panning state cursor change
   */
  handlePanningState(isPanning: boolean): void {
    if (isPanning) {
      this.setCursor(CursorState.GRABBING)
    } else {
      this.resetCursor()
    }
  }

  /**
   * Clean up cursor manager
   */
  destroy(): void {
    this.resetCursor()
    this.canvasElement = null
  }
}

// Create a singleton instance
let cursorManagerInstance: CursorManager | null = null

/**
 * Get the global cursor manager instance
 */
export const getCursorManager = (config?: CursorManagerConfig): CursorManager => {
  if (!cursorManagerInstance) {
    cursorManagerInstance = new CursorManager(config)
  }
  return cursorManagerInstance
}

/**
 * Reset the global cursor manager instance
 */
export const resetCursorManager = (): void => {
  if (cursorManagerInstance) {
    cursorManagerInstance.destroy()
    cursorManagerInstance = null
  }
}

export default CursorManager
