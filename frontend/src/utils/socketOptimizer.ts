/**
 * Socket Event Optimizer for efficient real-time communication
 */

export interface SocketEvent {
  type: string
  data: any
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  retryCount: number
  maxRetries: number
}

export interface SocketOptimizerConfig {
  maxEventsPerSecond: number
  eventThrottleMs: number
  priorityThreshold: number
  enableCompression: boolean
  enableDeduplication: boolean
  maxEventQueueSize: number
  batchSimilarEvents: boolean
  compressionThreshold: number
}

export interface SocketStats {
  totalEventsSent: number
  totalEventsReceived: number
  throttledEvents: number
  compressedEvents: number
  deduplicatedEvents: number
  batchedEvents: number
  averageEventSize: number
  averageProcessingTime: number
  eventsPerSecond: number
  queueSize: number
}

export interface EventBatch {
  events: SocketEvent[]
  timestamp: number
  priority: string
  compressed: boolean
}

class SocketEventOptimizer {
  private eventQueue: SocketEvent[] = []
  private eventHistory: Map<string, SocketEvent> = new Map()
  private stats: SocketStats
  private config: SocketOptimizerConfig
  private lastEventTime = 0
  private eventCount = 0
  private throttleTimer: NodeJS.Timeout | null = null
  private batchTimer: NodeJS.Timeout | null = null
  private isProcessing = false

  constructor(config: Partial<SocketOptimizerConfig> = {}) {
    this.config = {
      maxEventsPerSecond: 50,
      eventThrottleMs: 16, // ~60fps
      priorityThreshold: 3,
      enableCompression: true,
      enableDeduplication: true,
      maxEventQueueSize: 1000,
      batchSimilarEvents: true,
      compressionThreshold: 1024, // 1KB
      ...config
    }

    this.stats = {
      totalEventsSent: 0,
      totalEventsReceived: 0,
      throttledEvents: 0,
      compressedEvents: 0,
      deduplicatedEvents: 0,
      batchedEvents: 0,
      averageEventSize: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      queueSize: 0
    }
  }

  /**
   * Optimize and queue a socket event
   */
  optimizeEvent(event: Omit<SocketEvent, 'timestamp' | 'retryCount'>): string {
    const eventId = `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const socketEvent: SocketEvent = {
      ...event,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: event.maxRetries || 3
    }

    // Check for deduplication
    if (this.config.enableDeduplication && this.isDuplicateEvent(socketEvent)) {
      this.stats.deduplicatedEvents++
      return eventId
    }

    // Check rate limiting
    if (this.isRateLimited()) {
      this.stats.throttledEvents++
      this.queueEvent(socketEvent)
      return eventId
    }

    // Process immediately for critical events
    if (socketEvent.priority === 'critical') {
      this.processEvent(socketEvent)
      return eventId
    }

    // Queue for batch processing
    if (this.config.batchSimilarEvents) {
      this.queueEvent(socketEvent)
      this.scheduleBatchProcessing()
    } else {
      this.processEvent(socketEvent)
    }

    return eventId
  }

  /**
   * Check if an event is a duplicate
   */
  private isDuplicateEvent(event: SocketEvent): boolean {
    const key = `${event.type}_${JSON.stringify(event.data)}`
    const lastEvent = this.eventHistory.get(key)
    
    if (lastEvent && (event.timestamp - lastEvent.timestamp) < 100) { // 100ms window
      return true
    }
    
    this.eventHistory.set(key, event)
    return false
  }

  /**
   * Check if we're rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now()
    const timeDiff = now - this.lastEventTime
    
    if (timeDiff >= 1000) { // Reset counter every second
      this.eventCount = 0
      this.lastEventTime = now
    }
    
    return this.eventCount >= this.config.maxEventsPerSecond
  }

  /**
   * Queue an event for processing
   */
  private queueEvent(event: SocketEvent): void {
    if (this.eventQueue.length >= this.config.maxEventQueueSize) {
      // Remove oldest low priority events
      const lowPriorityIndex = this.eventQueue.findIndex(e => e.priority === 'low')
      if (lowPriorityIndex !== -1) {
        this.eventQueue.splice(lowPriorityIndex, 1)
      } else {
        // Remove oldest event if no low priority events
        this.eventQueue.shift()
      }
    }
    
    // Insert based on priority
    const insertIndex = this.findInsertIndex(event)
    this.eventQueue.splice(insertIndex, 0, event)
    
    this.stats.queueSize = this.eventQueue.length
  }

  /**
   * Find the correct index to insert an event based on priority
   */
  private findInsertIndex(event: SocketEvent): number {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
    const eventPriority = priorityOrder[event.priority]
    
    for (let i = 0; i < this.eventQueue.length; i++) {
      const queuePriority = priorityOrder[this.eventQueue[i].priority]
      if (eventPriority < queuePriority) {
        return i
      }
    }
    
    return this.eventQueue.length
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      return
    }
    
    this.batchTimer = setTimeout(() => {
      this.processBatch()
    }, this.config.eventThrottleMs)
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return
    }
    
    this.isProcessing = true
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    const startTime = Date.now()
    const eventsToProcess = this.eventQueue.splice(0, Math.min(10, this.eventQueue.length))
    
    try {
      // Group similar events
      const groupedEvents = this.groupSimilarEvents(eventsToProcess)
      
      // Process each group
      for (const group of groupedEvents) {
        if (group.events.length === 1) {
          await this.processEvent(group.events[0])
        } else {
          await this.processEventBatch(group)
        }
      }
      
      this.stats.batchedEvents += eventsToProcess.length
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      this.isProcessing = false
      this.stats.queueSize = this.eventQueue.length
      this.updateStats(Date.now() - startTime, eventsToProcess.length)
    }
  }

  /**
   * Group similar events together
   */
  private groupSimilarEvents(events: SocketEvent[]): EventBatch[] {
    const groups = new Map<string, SocketEvent[]>()
    
    for (const event of events) {
      const key = `${event.type}_${event.priority}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(event)
    }
    
    return Array.from(groups.entries()).map(([key, events]) => ({
      events,
      timestamp: Date.now(),
      priority: events[0].priority,
      compressed: this.shouldCompress(events)
    }))
  }

  /**
   * Check if events should be compressed
   */
  private shouldCompress(events: SocketEvent[]): boolean {
    if (!this.config.enableCompression) {
      return false
    }
    
    const totalSize = events.reduce((size, event) => {
      return size + JSON.stringify(event.data).length
    }, 0)
    
    return totalSize > this.config.compressionThreshold
  }

  /**
   * Process a single event
   */
  private async processEvent(event: SocketEvent): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Simulate event processing
      console.log(`Processing event: ${event.type}`, event.data)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
      
      this.stats.totalEventsSent++
      this.eventCount++
    } catch (error) {
      console.error(`Event processing failed: ${event.type}`, error)
      
      // Retry logic
      if (event.retryCount < event.maxRetries) {
        event.retryCount++
        this.queueEvent(event)
      }
    } finally {
      this.updateStats(Date.now() - startTime, 1)
    }
  }

  /**
   * Process a batch of events
   */
  private async processEventBatch(batch: EventBatch): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Compress if needed
      let processedData = batch.events
      if (batch.compressed) {
        processedData = this.compressEvents(batch.events)
        this.stats.compressedEvents++
      }
      
      // Simulate batch processing
      console.log(`Processing batch: ${batch.events.length} events`, {
        type: batch.events[0].type,
        priority: batch.priority,
        compressed: batch.compressed
      })
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20))
      
      this.stats.totalEventsSent += batch.events.length
      this.eventCount += batch.events.length
    } catch (error) {
      console.error('Batch processing failed:', error)
      
      // Retry individual events
      for (const event of batch.events) {
        if (event.retryCount < event.maxRetries) {
          event.retryCount++
          this.queueEvent(event)
        }
      }
    } finally {
      this.updateStats(Date.now() - startTime, batch.events.length)
    }
  }

  /**
   * Compress events data
   */
  private compressEvents(events: SocketEvent[]): SocketEvent[] {
    // Simple compression simulation - in real implementation would use actual compression
    return events.map(event => ({
      ...event,
      data: {
        ...event.data,
        _compressed: true,
        _originalSize: JSON.stringify(event.data).length
      }
    }))
  }

  /**
   * Update statistics
   */
  private updateStats(processingTime: number, eventCount: number): void {
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalEventsSent - eventCount) + processingTime) / this.stats.totalEventsSent
    
    // Calculate events per second
    const now = Date.now()
    const timeDiff = (now - this.lastEventTime) / 1000
    if (timeDiff > 0) {
      this.stats.eventsPerSecond = this.eventCount / timeDiff
    }
  }

  /**
   * Get current statistics
   */
  getStats(): SocketStats {
    return { ...this.stats }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      hasBatchTimer: this.batchTimer !== null,
      hasThrottleTimer: this.throttleTimer !== null,
      eventsInLastSecond: this.eventCount
    }
  }

  /**
   * Force process all queued events
   */
  async flushQueue(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    while (this.eventQueue.length > 0) {
      await this.processBatch()
    }
  }

  /**
   * Clear all queued events
   */
  clearQueue(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }
    
    this.eventQueue = []
    this.stats.queueSize = 0
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SocketOptimizerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get configuration
   */
  getConfig(): SocketOptimizerConfig {
    return { ...this.config }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEventsSent: 0,
      totalEventsReceived: 0,
      throttledEvents: 0,
      compressedEvents: 0,
      deduplicatedEvents: 0,
      batchedEvents: 0,
      averageEventSize: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      queueSize: 0
    }
  }
}

// Create singleton instance
export const socketEventOptimizer = new SocketEventOptimizer()

/**
 * Hook for using socket optimization in React components
 */
export function useSocketOptimization() {
  const optimizeEvent = (event: Omit<SocketEvent, 'timestamp' | 'retryCount'>) => {
    return socketEventOptimizer.optimizeEvent(event)
  }

  const getStats = () => {
    return socketEventOptimizer.getStats()
  }

  const getQueueStatus = () => {
    return socketEventOptimizer.getQueueStatus()
  }

  const flushQueue = () => {
    return socketEventOptimizer.flushQueue()
  }

  return {
    optimizeEvent,
    getStats,
    getQueueStatus,
    flushQueue,
    optimizer: socketEventOptimizer
  }
}
