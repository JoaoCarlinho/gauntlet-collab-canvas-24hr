/**
 * Connection Monitor Service for real-time connection status tracking
 */

// Create a simple EventEmitter-like class for browser compatibility
class SimpleEventEmitter {
  private listeners: Map<string, Function[]> = new Map()

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  off(event: string, listener: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args))
    }
  }
}

export interface ConnectionStatus {
  isConnected: boolean
  connectionType: 'websocket' | 'polling' | 'disconnected'
  lastConnected: number
  lastDisconnected: number
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectDelay: number
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline'
  latency: number
  packetLoss: number
  bandwidth: number
  uptime: number
  totalConnections: number
  totalDisconnections: number
  averageLatency: number
  connectionStability: number
}

export interface ConnectionEvent {
  type: 'connect' | 'disconnect' | 'reconnect' | 'error' | 'quality_change'
  timestamp: number
  details: any
  latency?: number
  error?: any
}

export interface NetworkQualityMetrics {
  latency: number
  packetLoss: number
  bandwidth: number
  jitter: number
  stability: number
}

class ConnectionMonitor extends SimpleEventEmitter {
  private status: ConnectionStatus
  private events: ConnectionEvent[] = []
  private maxEvents = 1000
  private pingInterval: NodeJS.Timeout | null = null
  private qualityCheckInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private startTime = Date.now()
  private latencyHistory: number[] = []
  private maxLatencyHistory = 50

  constructor() {
    super()
    this.status = this.initializeStatus()
    this.startMonitoring()
  }

  private initializeStatus(): ConnectionStatus {
    return {
      isConnected: false,
      connectionType: 'disconnected',
      lastConnected: 0,
      lastDisconnected: 0,
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      networkQuality: 'offline',
      latency: 0,
      packetLoss: 0,
      bandwidth: 0,
      uptime: 0,
      totalConnections: 0,
      totalDisconnections: 0,
      averageLatency: 0,
      connectionStability: 0
    }
  }

  /**
   * Start monitoring connection status
   */
  private startMonitoring(): void {
    // Monitor connection status every 5 seconds
    this.qualityCheckInterval = setInterval(() => {
      this.updateNetworkQuality()
      this.updateUptime()
      this.calculateConnectionStability()
    }, 5000)

    // Start ping monitoring
    this.startPingMonitoring()
  }

  /**
   * Start ping monitoring for latency measurement
   */
  private startPingMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    this.pingInterval = setInterval(() => {
      if (this.status.isConnected) {
        this.measureLatency()
      }
    }, 10000) // Ping every 10 seconds
  }

  /**
   * Measure connection latency
   */
  private measureLatency(): void {
    const startTime = performance.now()
    
    // Simulate ping by checking if we can emit a ping event
    // In a real implementation, this would ping the server
    this.emit('ping', { timestamp: startTime })
    
    // For now, simulate latency measurement
    setTimeout(() => {
      const latency = performance.now() - startTime
      this.updateLatency(latency)
    }, Math.random() * 50 + 10) // Simulate 10-60ms latency
  }

  /**
   * Update latency metrics
   */
  private updateLatency(latency: number): void {
    this.status.latency = latency
    this.latencyHistory.push(latency)
    
    if (this.latencyHistory.length > this.maxLatencyHistory) {
      this.latencyHistory.shift()
    }

    // Calculate average latency
    this.status.averageLatency = this.latencyHistory.reduce((sum, l) => sum + l, 0) / this.latencyHistory.length

    this.emit('latency_update', { latency, average: this.status.averageLatency })
  }

  /**
   * Update network quality based on metrics
   */
  private updateNetworkQuality(): void {
    const quality = this.calculateNetworkQuality()
    
    if (quality !== this.status.networkQuality) {
      const oldQuality = this.status.networkQuality
      this.status.networkQuality = quality
      
      this.addEvent({
        type: 'quality_change',
        timestamp: Date.now(),
        details: { from: oldQuality, to: quality }
      })

      this.emit('quality_change', { from: oldQuality, to: quality })
    }
  }

  /**
   * Calculate network quality based on metrics
   */
  private calculateNetworkQuality(): ConnectionStatus['networkQuality'] {
    if (!this.status.isConnected) {
      return 'offline'
    }

    const latency = this.status.averageLatency
    const packetLoss = this.status.packetLoss

    if (latency < 50 && packetLoss < 1) {
      return 'excellent'
    } else if (latency < 100 && packetLoss < 3) {
      return 'good'
    } else if (latency < 200 && packetLoss < 5) {
      return 'fair'
    } else {
      return 'poor'
    }
  }

  /**
   * Update uptime calculation
   */
  private updateUptime(): void {
    if (this.status.isConnected) {
      this.status.uptime = Date.now() - this.status.lastConnected
    }
  }

  /**
   * Calculate connection stability score
   */
  private calculateConnectionStability(): void {
    const recentEvents = this.events.filter(e => Date.now() - e.timestamp < 300000) // Last 5 minutes
    const disconnections = recentEvents.filter(e => e.type === 'disconnect').length
    const connections = recentEvents.filter(e => e.type === 'connect').length
    
    if (connections === 0) {
      this.status.connectionStability = 0
    } else {
      this.status.connectionStability = Math.max(0, 100 - (disconnections / connections) * 100)
    }
  }

  /**
   * Handle connection established
   */
  onConnect(connectionType: ConnectionStatus['connectionType'] = 'websocket'): void {
    const wasConnected = this.status.isConnected
    
    this.status.isConnected = true
    this.status.connectionType = connectionType
    this.status.lastConnected = Date.now()
    this.status.reconnectAttempts = 0
    this.status.totalConnections++

    if (!wasConnected) {
      this.addEvent({
        type: 'connect',
        timestamp: Date.now(),
        details: { connectionType }
      })

      this.emit('connect', { connectionType, timestamp: Date.now() })
    }

    // Start ping monitoring
    this.startPingMonitoring()
  }

  /**
   * Handle connection lost
   */
  onDisconnect(error?: any): void {
    const wasConnected = this.status.isConnected
    
    this.status.isConnected = false
    this.status.connectionType = 'disconnected'
    this.status.lastDisconnected = Date.now()
    this.status.totalDisconnections++

    if (wasConnected) {
      this.addEvent({
        type: 'disconnect',
        timestamp: Date.now(),
        details: { error },
        error
      })

      this.emit('disconnect', { error, timestamp: Date.now() })
    }

    // Stop ping monitoring
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  /**
   * Handle reconnection attempt
   */
  onReconnectAttempt(): void {
    this.status.reconnectAttempts++
    
    this.addEvent({
      type: 'reconnect',
      timestamp: Date.now(),
      details: { attempt: this.status.reconnectAttempts }
    })

    this.emit('reconnect_attempt', { 
      attempt: this.status.reconnectAttempts,
      maxAttempts: this.status.maxReconnectAttempts 
    })
  }

  /**
   * Handle connection error
   */
  onError(error: any): void {
    this.addEvent({
      type: 'error',
      timestamp: Date.now(),
      details: { error: error.message || error },
      error
    })

    this.emit('error', { error, timestamp: Date.now() })
  }

  /**
   * Add event to history
   */
  private addEvent(event: ConnectionEvent): void {
    this.events.push(event)
    
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status }
  }

  /**
   * Get connection events
   */
  getEvents(limit?: number): ConnectionEvent[] {
    const events = [...this.events]
    return limit ? events.slice(-limit) : events
  }

  /**
   * Get recent events by type
   */
  getEventsByType(type: ConnectionEvent['type'], limit?: number): ConnectionEvent[] {
    const events = this.events.filter(e => e.type === type)
    return limit ? events.slice(-limit) : events
  }

  /**
   * Get connection statistics
   */
  getStatistics(): {
    totalUptime: number
    totalDowntime: number
    averageSessionLength: number
    connectionReliability: number
    networkQualityTrend: ConnectionStatus['networkQuality'][]
    latencyTrend: number[]
  } {
    const now = Date.now()
    const totalUptime = this.events
      .filter(e => e.type === 'connect')
      .reduce((sum, event) => {
        const disconnectEvent = this.events.find(e => 
          e.type === 'disconnect' && e.timestamp > event.timestamp
        )
        const endTime = disconnectEvent ? disconnectEvent.timestamp : now
        return sum + (endTime - event.timestamp)
      }, 0)

    const totalDowntime = this.events
      .filter(e => e.type === 'disconnect')
      .reduce((sum, event) => {
        const connectEvent = this.events.find(e => 
          e.type === 'connect' && e.timestamp > event.timestamp
        )
        const endTime = connectEvent ? connectEvent.timestamp : now
        return sum + (endTime - event.timestamp)
      }, 0)

    const sessions = this.events.filter(e => e.type === 'connect').length
    const averageSessionLength = sessions > 0 ? totalUptime / sessions : 0

    const connectionReliability = totalUptime + totalDowntime > 0 
      ? (totalUptime / (totalUptime + totalDowntime)) * 100 
      : 0

    const networkQualityTrend = this.events
      .filter(e => e.type === 'quality_change')
      .map(e => e.details.to)
      .slice(-20) // Last 20 quality changes

    const latencyTrend = this.latencyHistory.slice(-20) // Last 20 latency measurements

    return {
      totalUptime,
      totalDowntime,
      averageSessionLength,
      connectionReliability,
      networkQualityTrend,
      latencyTrend
    }
  }

  /**
   * Check if connection is stable
   */
  isConnectionStable(): boolean {
    return this.status.connectionStability > 80 && this.status.networkQuality !== 'poor'
  }

  /**
   * Check if reconnection should be attempted
   */
  shouldAttemptReconnect(): boolean {
    return this.status.reconnectAttempts < this.status.maxReconnectAttempts
  }

  /**
   * Get next reconnect delay with exponential backoff
   */
  getNextReconnectDelay(): number {
    const baseDelay = this.status.reconnectDelay
    const exponentialDelay = baseDelay * Math.pow(2, this.status.reconnectAttempts)
    const maxDelay = 30000 // 30 seconds max
    return Math.min(exponentialDelay, maxDelay)
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectAttempts(): void {
    this.status.reconnectAttempts = 0
  }

  /**
   * Update network metrics
   */
  updateNetworkMetrics(metrics: Partial<NetworkQualityMetrics>): void {
    if (metrics.latency !== undefined) {
      this.updateLatency(metrics.latency)
    }
    if (metrics.packetLoss !== undefined) {
      this.status.packetLoss = metrics.packetLoss
    }
    if (metrics.bandwidth !== undefined) {
      this.status.bandwidth = metrics.bandwidth
    }
  }

  /**
   * Export connection data for debugging
   */
  exportData(): string {
    return JSON.stringify({
      status: this.status,
      events: this.events,
      statistics: this.getStatistics(),
      latencyHistory: this.latencyHistory
    }, null, 2)
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.events = []
    this.latencyHistory = []
    this.status = this.initializeStatus()
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval)
      this.qualityCheckInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }
}

// Create singleton instance
export const connectionMonitor = new ConnectionMonitor()
