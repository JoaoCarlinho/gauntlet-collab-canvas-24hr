/**
 * Batch Updates Utility for optimizing multiple object updates
 */

export interface BatchUpdate {
  id: string
  objectId: string
  operation: 'position' | 'resize' | 'properties' | 'create' | 'delete'
  data: any
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  retryCount: number
  maxRetries: number
}

export interface BatchConfig {
  maxBatchSize: number
  maxWaitTime: number
  priorityThreshold: number
  enableBatching: boolean
}

export interface BatchResult {
  success: boolean
  processedUpdates: BatchUpdate[]
  failedUpdates: BatchUpdate[]
  errors: string[]
  duration: number
  batchSize: number
}

export interface BatchStats {
  totalBatches: number
  successfulBatches: number
  failedBatches: number
  totalUpdates: number
  averageBatchSize: number
  averageProcessingTime: number
  totalSavedRequests: number
}

class BatchUpdateManager {
  private updateQueue: Map<string, BatchUpdate> = new Map()
  private batchTimer: NodeJS.Timeout | null = null
  private config: BatchConfig
  private stats: BatchStats
  private isProcessing = false

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 500, // 500ms
      priorityThreshold: 3,
      enableBatching: true,
      ...config
    }

    this.stats = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalUpdates: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0,
      totalSavedRequests: 0
    }
  }

  /**
   * Add an update to the batch queue
   */
  addUpdate(update: Omit<BatchUpdate, 'id' | 'timestamp' | 'retryCount'>): string {
    if (!this.config.enableBatching) {
      // If batching is disabled, process immediately
      this.processSingleUpdate(update as any)
      return `immediate_${Date.now()}`
    }

    const updateId = `${update.objectId}_${update.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const batchUpdate: BatchUpdate = {
      ...update,
      id: updateId,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: update.maxRetries || 3
    } as BatchUpdate

    // Check if we should process immediately based on priority
    if (this.shouldProcessImmediately(batchUpdate)) {
      this.processSingleUpdate(batchUpdate)
      return updateId
    }

    // Add to queue
    this.updateQueue.set(updateId, batchUpdate)

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.startBatchTimer()
    }

    // Check if we should process immediately due to batch size
    if (this.updateQueue.size >= this.config.maxBatchSize) {
      this.processBatch()
    }

    return updateId
  }

  /**
   * Determine if an update should be processed immediately
   */
  private shouldProcessImmediately(update: BatchUpdate): boolean {
    // Critical priority updates are always processed immediately
    if (update.priority === 'critical') {
      return true
    }

    // High priority updates with low retry count
    if (update.priority === 'high' && update.retryCount === 0) {
      return true
    }

    // If queue is empty and this is a high priority update
    if (this.updateQueue.size === 0 && update.priority === 'high') {
      return true
    }

    return false
  }

  /**
   * Start the batch processing timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setTimeout(() => {
      this.processBatch()
    }, this.config.maxWaitTime)
  }

  /**
   * Process a single update immediately
   */
  private async processSingleUpdate(update: BatchUpdate): Promise<void> {
    try {
      await this.executeUpdate(update)
      this.updateStats(true, [update], 1)
    } catch (error) {
      console.error('Single update failed:', error)
      this.updateStats(false, [update], 1)
    }
  }

  /**
   * Process the current batch of updates
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.updateQueue.size === 0) {
      return
    }

    this.isProcessing = true

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // Get updates from queue
    const updates = Array.from(this.updateQueue.values())
    this.updateQueue.clear()

    if (updates.length === 0) {
      this.isProcessing = false
      return
    }

    const startTime = Date.now()

    try {
      const result = await this.executeBatch(updates)
      this.updateStats(true, updates, Date.now() - startTime)
      
      // Handle failed updates
      if (result.failedUpdates.length > 0) {
        this.handleFailedUpdates(result.failedUpdates)
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
      this.updateStats(false, updates, Date.now() - startTime)
      
      // Retry failed updates
      this.handleFailedUpdates(updates)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Execute a batch of updates
   */
  private async executeBatch(updates: BatchUpdate[]): Promise<BatchResult> {
    const startTime = Date.now()
    const processedUpdates: BatchUpdate[] = []
    const failedUpdates: BatchUpdate[] = []
    const errors: string[] = []

    // Group updates by operation type
    const groupedUpdates = this.groupUpdatesByOperation(updates)

    // Process each group
    for (const [operation, operationUpdates] of groupedUpdates) {
      try {
        const result = await this.executeOperationBatch(operation, operationUpdates)
        processedUpdates.push(...result.processed)
        failedUpdates.push(...result.failed)
        errors.push(...result.errors)
      } catch (error) {
        console.error(`Batch operation ${operation} failed:`, error)
        failedUpdates.push(...operationUpdates)
        errors.push(`Operation ${operation} failed: ${error}`)
      }
    }

    return {
      success: failedUpdates.length === 0,
      processedUpdates,
      failedUpdates,
      errors,
      duration: Date.now() - startTime,
      batchSize: updates.length
    }
  }

  /**
   * Group updates by operation type
   */
  private groupUpdatesByOperation(updates: BatchUpdate[]): Map<string, BatchUpdate[]> {
    const grouped = new Map<string, BatchUpdate[]>()

    for (const update of updates) {
      const key = `${update.operation}_${update.objectId}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(update)
    }

    return grouped
  }

  /**
   * Execute a batch of updates for a specific operation
   */
  private async executeOperationBatch(_operation: string, updates: BatchUpdate[]): Promise<{
    processed: BatchUpdate[]
    failed: BatchUpdate[]
    errors: string[]
  }> {
    const processed: BatchUpdate[] = []
    const failed: BatchUpdate[] = []
    const errors: string[] = []

    // For now, process updates individually
    // In a real implementation, this would send a single batch request to the server
    for (const update of updates) {
      try {
        await this.executeUpdate(update)
        processed.push(update)
      } catch (error) {
        failed.push(update)
        errors.push(`Update ${update.id} failed: ${error}`)
      }
    }

    return { processed, failed, errors }
  }

  /**
   * Execute a single update
   */
  private async executeUpdate(update: BatchUpdate): Promise<void> {
    // This would integrate with the actual API service
    // For now, we'll simulate the update
    console.log(`Executing update: ${update.operation} for object ${update.objectId}`, update.data)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error(`Simulated failure for update ${update.id}`)
    }
  }

  /**
   * Handle failed updates by retrying or queuing
   */
  private handleFailedUpdates(failedUpdates: BatchUpdate[]): void {
    for (const update of failedUpdates) {
      if (update.retryCount < update.maxRetries) {
        // Retry the update
        update.retryCount++
        this.addUpdate(update)
      } else {
        console.error(`Update ${update.id} failed after ${update.maxRetries} retries`)
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(success: boolean, updates: BatchUpdate[], processingTime: number): void {
    this.stats.totalBatches++
    this.stats.totalUpdates += updates.length

    if (success) {
      this.stats.successfulBatches++
    } else {
      this.stats.failedBatches++
    }

    // Calculate average batch size
    this.stats.averageBatchSize = this.stats.totalUpdates / this.stats.totalBatches

    // Calculate average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalBatches - 1) + processingTime) / this.stats.totalBatches

    // Calculate saved requests (individual updates vs batched)
    this.stats.totalSavedRequests += Math.max(0, updates.length - 1)
  }

  /**
   * Get current statistics
   */
  getStats(): BatchStats {
    return { ...this.stats }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.updateQueue.size,
      isProcessing: this.isProcessing,
      hasTimer: this.batchTimer !== null,
      pendingUpdates: Array.from(this.updateQueue.values())
    }
  }

  /**
   * Force process current batch
   */
  async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    await this.processBatch()
  }

  /**
   * Clear all pending updates
   */
  clearQueue(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    this.updateQueue.clear()
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Enable or disable batching
   */
  setBatchingEnabled(enabled: boolean): void {
    this.config.enableBatching = enabled
    
    if (!enabled) {
      // Process any pending updates immediately
      this.flushBatch()
    }
  }

  /**
   * Get configuration
   */
  getConfig(): BatchConfig {
    return { ...this.config }
  }
}

// Create singleton instance
export const batchUpdateManager = new BatchUpdateManager()

/**
 * Hook for using batch updates in React components
 */
export function useBatchUpdates() {
  const addUpdate = (update: Omit<BatchUpdate, 'id' | 'timestamp' | 'retryCount'>) => {
    return batchUpdateManager.addUpdate(update)
  }

  const flushBatch = () => {
    return batchUpdateManager.flushBatch()
  }

  const getStats = () => {
    return batchUpdateManager.getStats()
  }

  const getQueueStatus = () => {
    return batchUpdateManager.getQueueStatus()
  }

  return {
    addUpdate,
    flushBatch,
    getStats,
    getQueueStatus,
    manager: batchUpdateManager
  }
}
