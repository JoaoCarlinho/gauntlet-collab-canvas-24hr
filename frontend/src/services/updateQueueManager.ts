/**
 * Update Queue Manager for handling failed updates and maintaining order
 */

import { v4 as uuidv4 } from 'uuid'
// import { CanvasObject } from '../types'
import { objectUpdateService } from './objectUpdateService'
import { errorLogger } from '../utils/errorLogger'
import { RetryOptions, RETRY_PRESETS } from '../utils/retryLogic'
// import { withRetry } from '../utils/retryLogic';

export interface QueuedUpdate {
  id: string
  canvasId: string
  idToken: string
  objectId: string
  operation: 'position' | 'resize' | 'properties' | 'create' | 'delete'
  data: any
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  dependencies?: string[] // IDs of updates that must complete first
  metadata?: {
    userAction?: string
    source?: 'user' | 'sync' | 'retry'
    originalTimestamp?: number
  }
}

export interface QueueStats {
  totalQueued: number
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
  averageWaitTime: number
  oldestPending?: QueuedUpdate
  queueSize: number
}

export interface QueueOptions {
  maxQueueSize?: number
  maxConcurrentUpdates?: number
  retryOptions?: RetryOptions
  priorityWeights?: Record<QueuedUpdate['priority'], number>
  autoProcess?: boolean
  processInterval?: number
}

class UpdateQueueManager {
  private queue: QueuedUpdate[] = []
  private processing = new Set<string>() // IDs of currently processing updates
  private completed = new Map<string, QueuedUpdate>() // Completed updates for reference
  private failed = new Map<string, QueuedUpdate>() // Failed updates for retry
  private options: Required<QueueOptions>
  private processInterval: NodeJS.Timeout | null = null
  private isProcessing = false
  private queueCallbacks: Array<(stats: QueueStats) => void> = []
  private connectionStatus = true

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize || 1000,
      maxConcurrentUpdates: options.maxConcurrentUpdates || 5,
      retryOptions: options.retryOptions || RETRY_PRESETS.STANDARD,
      priorityWeights: options.priorityWeights || {
        critical: 4,
        high: 3,
        normal: 2,
        low: 1
      },
      autoProcess: options.autoProcess !== false,
      processInterval: options.processInterval || 1000
    }

    if (this.options.autoProcess) {
      this.startAutoProcessing()
    }
  }

  /**
   * Add an update to the queue
   */
  enqueue(update: Omit<QueuedUpdate, 'id' | 'timestamp' | 'retryCount' | 'status'>): string {
    // Check queue size limit
    if (this.queue.length >= this.options.maxQueueSize) {
      // Remove oldest low priority items if queue is full
      this.removeOldestLowPriority()
    }

    const queuedUpdate: QueuedUpdate = {
      ...update,
      id: uuidv4(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    }

    // Insert based on priority and timestamp
    this.insertByPriority(queuedUpdate)
    
    console.log(`[UpdateQueueManager] Enqueued update ${queuedUpdate.id} for object ${queuedUpdate.objectId}`)
    this.notifyStatsChange()
    
    return queuedUpdate.id
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.connectionStatus) {
      return
    }

    this.isProcessing = true

    try {
      // Process updates up to the concurrent limit
      const availableSlots = this.options.maxConcurrentUpdates - this.processing.size
      const updatesToProcess = this.queue
        .filter(update => update.status === 'pending')
        .filter(update => this.canProcess(update))
        .slice(0, availableSlots)

      const processPromises = updatesToProcess.map(update => this.processUpdate(update))
      await Promise.allSettled(processPromises)

    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single update
   */
  private async processUpdate(update: QueuedUpdate): Promise<void> {
    if (this.processing.has(update.id)) {
      return
    }

    this.processing.add(update.id)
    update.status = 'processing'

    try {
      console.log(`[UpdateQueueManager] Processing update ${update.id} for object ${update.objectId}`)

      let result: any

      switch (update.operation) {
        case 'position':
          result = await objectUpdateService.updateObjectPosition(
            update.canvasId,
            update.idToken,
            update.objectId,
            update.data.x,
            update.data.y,
            {
              retryOptions: this.options.retryOptions,
              onProgress: (attempt, method) => {
                console.log(`Update ${update.id} progress: attempt ${attempt} via ${method}`)
              }
            }
          )
          break

        case 'resize':
          result = await objectUpdateService.updateObjectProperties(
            update.canvasId,
            update.idToken,
            update.objectId,
            update.data,
            {
              retryOptions: this.options.retryOptions
            }
          )
          break

        case 'properties':
          result = await objectUpdateService.updateObjectProperties(
            update.canvasId,
            update.idToken,
            update.objectId,
            update.data,
            {
              retryOptions: this.options.retryOptions
            }
          )
          break

        case 'create':
          // For create operations, we'd need to implement createObjectService
          // For now, mark as completed
          result = { success: true }
          break

        case 'delete':
          // For delete operations, we'd need to implement deleteObjectService
          // For now, mark as completed
          result = { success: true }
          break

        default:
          throw new Error(`Unknown operation: ${update.operation}`)
      }

      if (result.success) {
        update.status = 'completed'
        this.completed.set(update.id, update)
        console.log(`[UpdateQueueManager] Update ${update.id} completed successfully`)
      } else {
        throw new Error(result.error || 'Update failed')
      }

    } catch (error) {
      console.error(`[UpdateQueueManager] Update ${update.id} failed:`, error)
      
      update.retryCount++
      update.status = 'failed'

      if (update.retryCount < update.maxRetries) {
        // Re-queue for retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, update.retryCount), 30000)
        setTimeout(() => {
          update.status = 'pending'
          update.timestamp = Date.now() // Update timestamp for retry
          this.insertByPriority(update)
          this.notifyStatsChange()
        }, retryDelay)
      } else {
        // Max retries reached, move to failed
        this.failed.set(update.id, update)
        errorLogger.logError(error, {
          operation: 'general',
          objectId: update.objectId,
          timestamp: Date.now(),
          additionalData: {
            updateId: update.id,
            operation: update.operation,
            retryCount: update.retryCount,
            maxRetries: update.maxRetries
          }
        })
      }
    } finally {
      this.processing.delete(update.id)
      this.removeFromQueue(update.id)
      this.notifyStatsChange()
    }
  }

  /**
   * Check if an update can be processed (dependencies satisfied)
   */
  private canProcess(update: QueuedUpdate): boolean {
    if (!update.dependencies || update.dependencies.length === 0) {
      return true
    }

    // Check if all dependencies are completed
    return update.dependencies.every(depId => this.completed.has(depId))
  }

  /**
   * Insert update into queue based on priority
   */
  private insertByPriority(update: QueuedUpdate): void {
    const priorityWeight = this.options.priorityWeights[update.priority]
    
    // Find insertion point
    let insertIndex = this.queue.length
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = this.options.priorityWeights[this.queue[i].priority]
      if (priorityWeight > existingWeight) {
        insertIndex = i
        break
      } else if (priorityWeight === existingWeight && update.timestamp < this.queue[i].timestamp) {
        insertIndex = i
        break
      }
    }

    this.queue.splice(insertIndex, 0, update)
  }

  /**
   * Remove oldest low priority items when queue is full
   */
  private removeOldestLowPriority(): void {
    const lowPriorityIndex = this.queue.findIndex(update => update.priority === 'low')
    if (lowPriorityIndex !== -1) {
      const removed = this.queue.splice(lowPriorityIndex, 1)[0]
      console.warn(`[UpdateQueueManager] Removed low priority update ${removed.id} due to queue size limit`)
    }
  }

  /**
   * Remove update from queue
   */
  private removeFromQueue(updateId: string): void {
    const index = this.queue.findIndex(update => update.id === updateId)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  /**
   * Start automatic queue processing
   */
  startAutoProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval)
    }

    this.processInterval = setInterval(() => {
      this.processQueue()
    }, this.options.processInterval)
  }

  /**
   * Stop automatic queue processing
   */
  stopAutoProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  /**
   * Set connection status
   */
  setConnectionStatus(connected: boolean): void {
    this.connectionStatus = connected
    
    if (connected) {
      console.log('[UpdateQueueManager] Connection restored, processing queued updates')
      this.processQueue()
    } else {
      console.log('[UpdateQueueManager] Connection lost, pausing queue processing')
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const now = Date.now()
    const pendingUpdates = this.queue.filter(u => u.status === 'pending')
    const totalWaitTime = pendingUpdates.reduce((sum, update) => sum + (now - update.timestamp), 0)
    
    return {
      totalQueued: this.queue.length + this.completed.size + this.failed.size,
      pending: this.queue.filter(u => u.status === 'pending').length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      cancelled: this.queue.filter(u => u.status === 'cancelled').length,
      averageWaitTime: pendingUpdates.length > 0 ? totalWaitTime / pendingUpdates.length : 0,
      oldestPending: pendingUpdates.sort((a, b) => a.timestamp - b.timestamp)[0],
      queueSize: this.queue.length
    }
  }

  /**
   * Get updates by status
   */
  getUpdatesByStatus(status: QueuedUpdate['status']): QueuedUpdate[] {
    return this.queue.filter(update => update.status === status)
  }

  /**
   * Get failed updates for manual retry
   */
  getFailedUpdates(): QueuedUpdate[] {
    return Array.from(this.failed.values())
  }

  /**
   * Retry failed update
   */
  retryFailedUpdate(updateId: string): void {
    const failedUpdate = this.failed.get(updateId)
    if (failedUpdate) {
      this.failed.delete(updateId)
      failedUpdate.status = 'pending'
      failedUpdate.retryCount = 0
      failedUpdate.timestamp = Date.now()
      this.insertByPriority(failedUpdate)
      this.notifyStatsChange()
    }
  }

  /**
   * Cancel update
   */
  cancelUpdate(updateId: string): boolean {
    const updateIndex = this.queue.findIndex(update => update.id === updateId)
    if (updateIndex !== -1) {
      this.queue[updateIndex].status = 'cancelled'
      this.removeFromQueue(updateId)
      this.notifyStatsChange()
      return true
    }
    return false
  }

  /**
   * Clear completed updates
   */
  clearCompleted(): void {
    this.completed.clear()
    this.notifyStatsChange()
  }

  /**
   * Clear failed updates
   */
  clearFailed(): void {
    this.failed.clear()
    this.notifyStatsChange()
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.queue = []
    this.processing.clear()
    this.completed.clear()
    this.failed.clear()
    this.notifyStatsChange()
  }

  /**
   * Register callback for stats changes
   */
  onStatsChange(callback: (stats: QueueStats) => void): void {
    this.queueCallbacks.push(callback)
  }

  /**
   * Remove stats callback
   */
  offStatsChange(callback: (stats: QueueStats) => void): void {
    const index = this.queueCallbacks.indexOf(callback)
    if (index > -1) {
      this.queueCallbacks.splice(index, 1)
    }
  }

  /**
   * Notify stats change
   */
  private notifyStatsChange(): void {
    const stats = this.getStats()
    this.queueCallbacks.forEach(callback => {
      try {
        callback(stats)
      } catch (error) {
        console.error('Error in queue stats callback:', error)
      }
    })
  }

  /**
   * Export queue data for debugging
   */
  exportQueueData(): string {
    return JSON.stringify({
      queue: this.queue,
      processing: Array.from(this.processing),
      completed: Array.from(this.completed.values()),
      failed: Array.from(this.failed.values()),
      stats: this.getStats()
    }, null, 2)
  }
}

// Create singleton instance
export const updateQueueManager = new UpdateQueueManager()
