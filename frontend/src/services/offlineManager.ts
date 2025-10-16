/**
 * Offline Manager Service for handling offline mode and data synchronization
 */

import { EventEmitter } from 'events'
import { CanvasObject } from '../types'
import { errorLogger } from '../utils/errorLogger'

export interface OfflineUpdate {
  id: string
  type: 'create' | 'update' | 'delete'
  objectId: string
  data: any
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  retryCount: number
  maxRetries: number
}

export interface OfflineState {
  isOffline: boolean
  lastOnline: number
  offlineDuration: number
  pendingUpdates: OfflineUpdate[]
  cachedObjects: Map<string, CanvasObject>
  syncInProgress: boolean
  totalOfflineTime: number
  totalSyncOperations: number
  successfulSyncs: number
  failedSyncs: number
}

export interface SyncResult {
  success: boolean
  syncedUpdates: OfflineUpdate[]
  failedUpdates: OfflineUpdate[]
  errors: string[]
  duration: number
}

class OfflineManager extends EventEmitter {
  private state: OfflineState
  private syncQueue: OfflineUpdate[] = []
  private maxOfflineUpdates = 1000
  private syncBatchSize = 50
  private syncTimeout = 30000 // 30 seconds

  constructor() {
    super()
    this.state = this.initializeState()
    this.setupEventListeners()
    this.startOfflineDetection()
  }

  private initializeState(): OfflineState {
    return {
      isOffline: false,
      lastOnline: Date.now(),
      offlineDuration: 0,
      pendingUpdates: [],
      cachedObjects: new Map(),
      syncInProgress: false,
      totalOfflineTime: 0,
      totalSyncOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0
    }
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    // Browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Visibility change (tab focus/blur)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    // Page unload (save state)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
  }

  /**
   * Start offline detection monitoring
   */
  private startOfflineDetection(): void {
    // Check connection status periodically
    setInterval(() => {
      this.checkConnectionStatus()
    }, 5000)

    // Update offline duration
    setInterval(() => {
      if (this.state.isOffline) {
        this.state.offlineDuration = Date.now() - this.state.lastOnline
        this.emit('offline_duration_update', this.state.offlineDuration)
      }
    }, 1000)
  }

  /**
   * Check connection status
   */
  private checkConnectionStatus(): void {
    const isOnline = navigator.onLine
    
    if (isOnline && this.state.isOffline) {
      this.handleOnline()
    } else if (!isOnline && !this.state.isOffline) {
      this.handleOffline()
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    const wasOffline = this.state.isOffline
    
    this.state.isOffline = false
    this.state.lastOnline = Date.now()
    
    if (wasOffline) {
      this.state.totalOfflineTime += this.state.offlineDuration
      this.state.offlineDuration = 0
      
      this.emit('online', {
        offlineDuration: this.state.totalOfflineTime,
        pendingUpdates: this.state.pendingUpdates.length
      })

      // Start sync process
      this.startSync()
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.state.isOffline = true
    this.state.lastOnline = Date.now()
    this.state.offlineDuration = 0
    
    this.emit('offline', {
      timestamp: Date.now(),
      pendingUpdates: this.state.pendingUpdates.length
    })
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && !this.state.isOffline) {
      // Page became visible, check if we need to sync
      this.checkPendingUpdates()
    }
  }

  /**
   * Handle before unload
   */
  private handleBeforeUnload(): void {
    // Save offline state to localStorage
    this.saveOfflineState()
  }

  /**
   * Cache object for offline access
   */
  cacheObject(object: CanvasObject): void {
    this.state.cachedObjects.set(object.id, { ...object })
    this.emit('object_cached', { objectId: object.id })
  }

  /**
   * Get cached object
   */
  getCachedObject(objectId: string): CanvasObject | undefined {
    return this.state.cachedObjects.get(objectId)
  }

  /**
   * Get all cached objects
   */
  getCachedObjects(): CanvasObject[] {
    return Array.from(this.state.cachedObjects.values())
  }

  /**
   * Add update to offline queue
   */
  addOfflineUpdate(
    type: OfflineUpdate['type'],
    objectId: string,
    data: any,
    priority: OfflineUpdate['priority'] = 'normal'
  ): string {
    const update: OfflineUpdate = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      objectId,
      data,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: 3
    }

    // Add to queue based on priority
    this.addToQueue(update)
    this.state.pendingUpdates.push(update)

    // Limit queue size
    if (this.state.pendingUpdates.length > this.maxOfflineUpdates) {
      // Remove oldest low priority updates
      this.state.pendingUpdates = this.state.pendingUpdates
        .filter(update => update.priority !== 'low')
        .slice(0, this.maxOfflineUpdates)
    }

    this.emit('offline_update_added', update)

    // If online, try to sync immediately
    if (!this.state.isOffline) {
      this.syncUpdate(update)
    }

    return update.id
  }

  /**
   * Add update to sync queue based on priority
   */
  private addToQueue(update: OfflineUpdate): void {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 }
    const updatePriority = priorityOrder[update.priority]
    
    let insertIndex = this.syncQueue.length
    for (let i = 0; i < this.syncQueue.length; i++) {
      if (priorityOrder[this.syncQueue[i].priority] < updatePriority) {
        insertIndex = i
        break
      }
    }
    
    this.syncQueue.splice(insertIndex, 0, update)
  }

  /**
   * Start synchronization process
   */
  private startSync(): void {
    if (this.state.syncInProgress || this.state.pendingUpdates.length === 0) {
      return
    }

    this.state.syncInProgress = true
    this.state.totalSyncOperations++

    this.emit('sync_started', {
      pendingUpdates: this.state.pendingUpdates.length,
      timestamp: Date.now()
    })

    this.processSyncQueue()
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    const batch = this.syncQueue.splice(0, this.syncBatchSize)
    
    if (batch.length === 0) {
      this.state.syncInProgress = false
      this.emit('sync_completed', {
        timestamp: Date.now(),
        totalOperations: this.state.totalSyncOperations
      })
      return
    }

    try {
      const result = await this.syncBatch(batch)
      
      if (result.success) {
        this.state.successfulSyncs++
        this.removeSyncedUpdates(result.syncedUpdates)
      } else {
        this.state.failedSyncs++
        this.handleSyncErrors(result.failedUpdates, result.errors)
      }

      this.emit('sync_batch_completed', result)

    } catch (error) {
      console.error('Sync batch failed:', error)
      this.state.failedSyncs++
      this.emit('sync_error', { error, batch })
    }

    // Continue processing remaining updates
    setTimeout(() => {
      this.processSyncQueue()
    }, 1000) // Wait 1 second between batches
  }

  /**
   * Sync a batch of updates
   */
  private async syncBatch(updates: OfflineUpdate[]): Promise<SyncResult> {
    const startTime = Date.now()
    const syncedUpdates: OfflineUpdate[] = []
    const failedUpdates: OfflineUpdate[] = []
    const errors: string[] = []

    for (const update of updates) {
      try {
        const success = await this.syncUpdate(update)
        
        if (success) {
          syncedUpdates.push(update)
        } else {
          failedUpdates.push(update)
          errors.push(`Failed to sync update ${update.id}`)
        }
      } catch (error) {
        failedUpdates.push(update)
        errors.push(`Error syncing update ${update.id}: ${error}`)
      }
    }

    return {
      success: syncedUpdates.length > 0,
      syncedUpdates,
      failedUpdates,
      errors,
      duration: Date.now() - startTime
    }
  }

  /**
   * Sync individual update
   */
  private async syncUpdate(update: OfflineUpdate): Promise<boolean> {
    try {
      // This would integrate with the actual API calls
      // For now, simulate the sync process
      
      update.retryCount++
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      
      // Simulate success/failure
      const success = Math.random() > 0.1 // 90% success rate
      
      if (success) {
        this.emit('update_synced', update)
        return true
      } else {
        throw new Error('Simulated sync failure')
      }
      
    } catch (error) {
      errorLogger.logError(error, {
        operation: 'offline_sync',
        objectId: update.objectId,
        timestamp: Date.now(),
        additionalData: {
          updateId: update.id,
          updateType: update.type,
          retryCount: update.retryCount
        }
      })
      
      this.emit('update_sync_failed', { update, error })
      return false
    }
  }

  /**
   * Remove successfully synced updates
   */
  private removeSyncedUpdates(syncedUpdates: OfflineUpdate[]): void {
    const syncedIds = new Set(syncedUpdates.map(u => u.id))
    
    this.state.pendingUpdates = this.state.pendingUpdates.filter(
      update => !syncedIds.has(update.id)
    )
    
    this.syncQueue = this.syncQueue.filter(
      update => !syncedIds.has(update.id)
    )
  }

  /**
   * Handle sync errors
   */
  private handleSyncErrors(failedUpdates: OfflineUpdate[], errors: string[]): void {
    // Retry failed updates if they haven't exceeded max retries
    for (const update of failedUpdates) {
      if (update.retryCount < update.maxRetries) {
        this.addToQueue(update)
      } else {
        // Remove permanently failed updates
        this.state.pendingUpdates = this.state.pendingUpdates.filter(
          u => u.id !== update.id
        )
        this.emit('update_permanently_failed', update)
      }
    }
  }

  /**
   * Check for pending updates
   */
  private checkPendingUpdates(): void {
    if (this.state.pendingUpdates.length > 0 && !this.state.isOffline) {
      this.startSync()
    }
  }

  /**
   * Save offline state to localStorage
   */
  private saveOfflineState(): void {
    try {
      const stateData = {
        pendingUpdates: this.state.pendingUpdates,
        cachedObjects: Array.from(this.state.cachedObjects.entries()),
        lastOnline: this.state.lastOnline,
        totalOfflineTime: this.state.totalOfflineTime
      }
      
      localStorage.setItem('collabcanvas_offline_state', JSON.stringify(stateData))
    } catch (error) {
      console.error('Failed to save offline state:', error)
    }
  }

  /**
   * Load offline state from localStorage
   */
  loadOfflineState(): void {
    try {
      const stateData = localStorage.getItem('collabcanvas_offline_state')
      
      if (stateData) {
        const parsed = JSON.parse(stateData)
        
        this.state.pendingUpdates = parsed.pendingUpdates || []
        this.state.cachedObjects = new Map(parsed.cachedObjects || [])
        this.state.lastOnline = parsed.lastOnline || Date.now()
        this.state.totalOfflineTime = parsed.totalOfflineTime || 0
        
        // Rebuild sync queue
        this.syncQueue = [...this.state.pendingUpdates]
        this.syncQueue.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
        
        this.emit('offline_state_loaded', {
          pendingUpdates: this.state.pendingUpdates.length,
          cachedObjects: this.state.cachedObjects.size
        })
      }
    } catch (error) {
      console.error('Failed to load offline state:', error)
    }
  }

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return { ...this.state }
  }

  /**
   * Get pending updates count
   */
  getPendingUpdatesCount(): number {
    return this.state.pendingUpdates.length
  }

  /**
   * Get offline statistics
   */
  getStatistics(): {
    totalOfflineTime: number
    totalSyncOperations: number
    successfulSyncs: number
    failedSyncs: number
    syncSuccessRate: number
    averageOfflineDuration: number
  } {
    const syncSuccessRate = this.state.totalSyncOperations > 0 
      ? (this.state.successfulSyncs / this.state.totalSyncOperations) * 100 
      : 0

    return {
      totalOfflineTime: this.state.totalOfflineTime,
      totalSyncOperations: this.state.totalSyncOperations,
      successfulSyncs: this.state.successfulSyncs,
      failedSyncs: this.state.failedSyncs,
      syncSuccessRate,
      averageOfflineDuration: this.state.totalOfflineTime / Math.max(1, this.state.totalSyncOperations)
    }
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    this.state.pendingUpdates = []
    this.state.cachedObjects.clear()
    this.syncQueue = []
    localStorage.removeItem('collabcanvas_offline_state')
    this.emit('offline_data_cleared')
  }

  /**
   * Force sync all pending updates
   */
  forceSync(): void {
    if (!this.state.isOffline) {
      this.startSync()
    }
  }

  /**
   * Check if offline mode is active
   */
  isOffline(): boolean {
    return this.state.isOffline
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.state.syncInProgress
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager()
