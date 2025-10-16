/**
 * Loading State Manager for object updates
 */

export interface LoadingState {
  objectId: string
  operation: 'position' | 'resize' | 'properties' | 'create' | 'delete'
  startTime: number
  method: 'socket' | 'rest'
  attempt: number
  isOptimistic: boolean
  progress?: number // 0-100
}

export interface LoadingStateOptions {
  preventMultiple?: boolean
  maxConcurrent?: number
  timeout?: number
}

class LoadingStateManager {
  private loadingStates = new Map<string, LoadingState>()
  private maxConcurrentUpdates = 5
  private defaultTimeout = 30000 // 30 seconds
  private updateQueue: Array<{ objectId: string; operation: string; timestamp: number }> = []

  /**
   * Start loading state for an object
   */
  startLoading(
    objectId: string,
    operation: LoadingState['operation'],
    method: LoadingState['method'] = 'socket',
    options: LoadingStateOptions = {}
  ): boolean {
    const { preventMultiple = true, maxConcurrent = this.maxConcurrentUpdates, timeout = this.defaultTimeout } = options

    // Check if already loading (if preventMultiple is true)
    if (preventMultiple && this.isLoading(objectId)) {
      console.warn(`Object ${objectId} is already being updated, queuing operation`)
      this.queueUpdate(objectId, operation)
      return false
    }

    // Check concurrent update limit
    if (this.getActiveLoadingCount() >= maxConcurrent) {
      console.warn(`Maximum concurrent updates reached (${maxConcurrent}), queuing operation`)
      this.queueUpdate(objectId, operation)
      return false
    }

    const loadingState: LoadingState = {
      objectId,
      operation,
      startTime: Date.now(),
      method,
      attempt: 1,
      isOptimistic: false
    }

    this.loadingStates.set(objectId, loadingState)

    // Set timeout to prevent stuck loading states
    setTimeout(() => {
      if (this.isLoading(objectId)) {
        console.warn(`Loading state timeout for object ${objectId}`)
        this.stopLoading(objectId, 'timeout')
      }
    }, timeout)

    return true
  }

  /**
   * Update loading state progress
   */
  updateProgress(objectId: string, progress: number, method?: LoadingState['method'], attempt?: number): boolean {
    const state = this.loadingStates.get(objectId)
    if (!state) return false

    state.progress = Math.max(0, Math.min(100, progress))
    if (method) state.method = method
    if (attempt) state.attempt = attempt

    return true
  }

  /**
   * Stop loading state for an object
   */
  stopLoading(objectId: string, reason: 'success' | 'error' | 'timeout' | 'cancelled' = 'success'): LoadingState | null {
    const state = this.loadingStates.get(objectId)
    if (!state) return null

    this.loadingStates.delete(objectId)

    // Process queued updates if any
    this.processQueue()

    return state
  }

  /**
   * Check if an object is currently loading
   */
  isLoading(objectId: string): boolean {
    return this.loadingStates.has(objectId)
  }

  /**
   * Get loading state for an object
   */
  getLoadingState(objectId: string): LoadingState | null {
    return this.loadingStates.get(objectId) || null
  }

  /**
   * Get all active loading states
   */
  getActiveLoadingStates(): LoadingState[] {
    return Array.from(this.loadingStates.values())
  }

  /**
   * Get count of active loading states
   */
  getActiveLoadingCount(): number {
    return this.loadingStates.size
  }

  /**
   * Get loading states by operation type
   */
  getLoadingStatesByOperation(operation: LoadingState['operation']): LoadingState[] {
    return this.getActiveLoadingStates().filter(state => state.operation === operation)
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): {
    active: number
    byOperation: Record<string, number>
    byMethod: Record<string, number>
    averageDuration: number
    queuedUpdates: number
  } {
    const active = this.getActiveLoadingStates()
    const byOperation: Record<string, number> = {}
    const byMethod: Record<string, number> = {}
    let totalDuration = 0

    active.forEach(state => {
      byOperation[state.operation] = (byOperation[state.operation] || 0) + 1
      byMethod[state.method] = (byMethod[state.method] || 0) + 1
      totalDuration += Date.now() - state.startTime
    })

    return {
      active: active.length,
      byOperation,
      byMethod,
      averageDuration: active.length > 0 ? totalDuration / active.length : 0,
      queuedUpdates: this.updateQueue.length
    }
  }

  /**
   * Queue an update for later processing
   */
  private queueUpdate(objectId: string, operation: string): void {
    this.updateQueue.push({
      objectId,
      operation,
      timestamp: Date.now()
    })

    // Keep queue size manageable
    if (this.updateQueue.length > 50) {
      this.updateQueue.shift()
    }
  }

  /**
   * Process queued updates
   */
  private processQueue(): void {
    if (this.updateQueue.length === 0) return

    const queuedUpdate = this.updateQueue.shift()
    if (!queuedUpdate) return

    // Check if we can process this update now
    if (!this.isLoading(queuedUpdate.objectId) && this.getActiveLoadingCount() < this.maxConcurrentUpdates) {
      // Re-attempt the update (this would need to be handled by the calling code)
      console.log(`Processing queued update for object ${queuedUpdate.objectId}`)
    } else {
      // Put it back in the queue
      this.updateQueue.unshift(queuedUpdate)
    }
  }

  /**
   * Clear all loading states (emergency cleanup)
   */
  clearAllLoadingStates(): void {
    this.loadingStates.clear()
    this.updateQueue = []
  }

  /**
   * Clear loading state for specific object
   */
  clearLoadingState(objectId: string): void {
    this.loadingStates.delete(objectId)
  }

  /**
   * Get queued updates
   */
  getQueuedUpdates(): Array<{ objectId: string; operation: string; timestamp: number }> {
    return [...this.updateQueue]
  }

  /**
   * Clear queued updates
   */
  clearQueuedUpdates(): void {
    this.updateQueue = []
  }

  /**
   * Set maximum concurrent updates
   */
  setMaxConcurrentUpdates(max: number): void {
    this.maxConcurrentUpdates = Math.max(1, max)
  }

  /**
   * Get objects that have been loading for too long
   */
  getStuckLoadingStates(thresholdMs: number = 10000): LoadingState[] {
    const now = Date.now()
    return this.getActiveLoadingStates().filter(state => 
      now - state.startTime > thresholdMs
    )
  }

  /**
   * Force cleanup of stuck loading states
   */
  cleanupStuckLoadingStates(thresholdMs: number = 10000): number {
    const stuckStates = this.getStuckLoadingStates(thresholdMs)
    stuckStates.forEach(state => {
      this.stopLoading(state.objectId, 'timeout')
    })
    return stuckStates.length
  }
}

// Create singleton instance
export const loadingStateManager = new LoadingStateManager()

// Auto-cleanup stuck loading states every 30 seconds
setInterval(() => {
  const cleaned = loadingStateManager.cleanupStuckLoadingStates()
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} stuck loading states`)
  }
}, 30000)
