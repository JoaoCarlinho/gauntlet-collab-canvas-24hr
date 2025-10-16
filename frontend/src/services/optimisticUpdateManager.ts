/**
 * Optimistic Update Manager for immediate visual feedback
 */

import { CanvasObject } from '../types'

export interface OptimisticState {
  objectId: string
  originalState: CanvasObject
  optimisticState: CanvasObject
  timestamp: number
  operation: 'position' | 'resize' | 'properties'
  isActive: boolean
}

export interface UpdateOperation {
  objectId: string
  properties: Record<string, any>
  operation: 'position' | 'resize' | 'properties'
}

class OptimisticUpdateManager {
  private optimisticStates = new Map<string, OptimisticState>()
  private updateHistory: OptimisticState[] = []
  private maxHistorySize = 50

  /**
   * Start optimistic update - immediately update local state
   */
  startOptimisticUpdate(
    objectId: string,
    currentObject: CanvasObject,
    newProperties: Record<string, any>,
    operation: 'position' | 'resize' | 'properties'
  ): OptimisticState {
    // Store original state
    const originalState = { ...currentObject }
    
    // Create optimistic state
    const optimisticState: CanvasObject = {
      ...currentObject,
      properties: {
        ...currentObject.properties,
        ...newProperties
      }
    }

    const optimisticUpdate: OptimisticState = {
      objectId,
      originalState,
      optimisticState,
      timestamp: Date.now(),
      operation,
      isActive: true
    }

    // Store the optimistic state
    this.optimisticStates.set(objectId, optimisticUpdate)
    
    // Add to history
    this.updateHistory.push(optimisticUpdate)
    if (this.updateHistory.length > this.maxHistorySize) {
      this.updateHistory.shift()
    }

    return optimisticUpdate
  }

  /**
   * Get optimistic state for an object
   */
  getOptimisticState(objectId: string): OptimisticState | null {
    return this.optimisticStates.get(objectId) || null
  }

  /**
   * Get optimistic object (with updated properties)
   */
  getOptimisticObject(objectId: string, originalObject: CanvasObject): CanvasObject {
    const optimisticState = this.optimisticStates.get(objectId)
    if (!optimisticState || !optimisticState.isActive) {
      return originalObject
    }
    return optimisticState.optimisticState
  }

  /**
   * Update optimistic state during drag/resize operations
   */
  updateOptimisticState(
    objectId: string,
    newProperties: Record<string, any>
  ): boolean {
    const optimisticState = this.optimisticStates.get(objectId)
    if (!optimisticState || !optimisticState.isActive) {
      return false
    }

    // Update the optimistic state
    optimisticState.optimisticState = {
      ...optimisticState.optimisticState,
      properties: {
        ...optimisticState.optimisticState.properties,
        ...newProperties
      }
    }

    optimisticState.timestamp = Date.now()
    return true
  }

  /**
   * Confirm optimistic update (server confirmed)
   */
  confirmOptimisticUpdate(objectId: string, serverObject: CanvasObject): boolean {
    const optimisticState = this.optimisticStates.get(objectId)
    if (!optimisticState || !optimisticState.isActive) {
      return false
    }

    // Mark as confirmed and inactive
    optimisticState.isActive = false
    optimisticState.optimisticState = serverObject

    // Remove from active states
    this.optimisticStates.delete(objectId)

    return true
  }

  /**
   * Rollback optimistic update (server update failed)
   */
  rollbackOptimisticUpdate(objectId: string): CanvasObject | null {
    const optimisticState = this.optimisticStates.get(objectId)
    if (!optimisticState || !optimisticState.isActive) {
      return null
    }

    // Mark as rolled back and inactive
    optimisticState.isActive = false

    // Remove from active states
    this.optimisticStates.delete(objectId)

    // Return original state for rollback
    return optimisticState.originalState
  }

  /**
   * Get all active optimistic updates
   */
  getActiveOptimisticUpdates(): OptimisticState[] {
    return Array.from(this.optimisticStates.values()).filter(state => state.isActive)
  }

  /**
   * Get optimistic update history
   */
  getUpdateHistory(): OptimisticState[] {
    return [...this.updateHistory]
  }

  /**
   * Clear all optimistic states (cleanup)
   */
  clearAllOptimisticStates(): void {
    this.optimisticStates.clear()
  }

  /**
   * Clear optimistic state for specific object
   */
  clearOptimisticState(objectId: string): void {
    this.optimisticStates.delete(objectId)
  }

  /**
   * Get statistics about optimistic updates
   */
  getOptimisticUpdateStats(): {
    activeUpdates: number
    totalHistory: number
    recentUpdates: number
    operationBreakdown: Record<string, number>
  } {
    const activeUpdates = this.getActiveOptimisticUpdates().length
    const totalHistory = this.updateHistory.length
    const recentUpdates = this.updateHistory.filter(
      update => Date.now() - update.timestamp < 60000 // Last minute
    ).length

    const operationBreakdown: Record<string, number> = {}
    this.updateHistory.forEach(update => {
      operationBreakdown[update.operation] = (operationBreakdown[update.operation] || 0) + 1
    })

    return {
      activeUpdates,
      totalHistory,
      recentUpdates,
      operationBreakdown
    }
  }

  /**
   * Check if object has active optimistic update
   */
  hasActiveOptimisticUpdate(objectId: string): boolean {
    const state = this.optimisticStates.get(objectId)
    return state ? state.isActive : false
  }

  /**
   * Get time since optimistic update started
   */
  getOptimisticUpdateAge(objectId: string): number | null {
    const state = this.optimisticStates.get(objectId)
    return state ? Date.now() - state.timestamp : null
  }

  /**
   * Force cleanup of old optimistic states (older than 30 seconds)
   */
  cleanupOldOptimisticStates(): number {
    const cutoffTime = Date.now() - 30000 // 30 seconds
    let cleanedCount = 0

    for (const [objectId, state] of this.optimisticStates.entries()) {
      if (state.timestamp < cutoffTime) {
        this.optimisticStates.delete(objectId)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}

// Create singleton instance
export const optimisticUpdateManager = new OptimisticUpdateManager()

// Auto-cleanup old states every 30 seconds
setInterval(() => {
  const cleaned = optimisticUpdateManager.cleanupOldOptimisticStates()
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} old optimistic states`)
  }
}, 30000)
