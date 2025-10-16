/**
 * State Synchronization Manager for detecting and resolving conflicts
 */

import { CanvasObject } from '../types'
import { canvasAPI } from './api'
import { errorLogger } from '../utils/errorLogger'

export interface StateConflict {
  objectId: string
  localObject: CanvasObject
  serverObject: CanvasObject
  conflictType: 'position' | 'properties' | 'deletion' | 'creation'
  timestamp: number
  severity: 'low' | 'medium' | 'high'
}

export interface SyncResult {
  success: boolean
  conflicts: StateConflict[]
  resolvedConflicts: StateConflict[]
  errors: string[]
  lastSyncTime: number
}

export interface SyncOptions {
  forceRefresh?: boolean
  resolveConflicts?: boolean
  conflictResolutionStrategy?: 'server_wins' | 'client_wins' | 'merge' | 'prompt_user'
  maxRetries?: number
}

class StateSyncManager {
  private lastSyncTime = 0
  private syncInProgress = false
  private conflictResolutionStrategy: SyncOptions['conflictResolutionStrategy'] = 'server_wins'
  private syncInterval: NodeJS.Timeout | null = null
  private conflictCallbacks: Array<(conflicts: StateConflict[]) => void> = []

  /**
   * Start automatic state synchronization
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncState()
      } catch (error) {
        console.error('Auto sync failed:', error)
      }
    }, intervalMs)
  }

  /**
   * Stop automatic state synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sync local state with server state
   */
  async syncState(
    canvasId: string,
    localObjects: CanvasObject[],
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        conflicts: [],
        resolvedConflicts: [],
        errors: ['Sync already in progress'],
        lastSyncTime: this.lastSyncTime
      }
    }

    this.syncInProgress = true
    const startTime = Date.now()

    try {
      // Get server state
      const serverResponse = await canvasAPI.getCanvasObjects(canvasId)
      const serverObjects = serverResponse.objects

      // Detect conflicts
      const conflicts = this.detectConflicts(localObjects, serverObjects)

      // Resolve conflicts if requested
      let resolvedConflicts: StateConflict[] = []
      if (options.resolveConflicts && conflicts.length > 0) {
        resolvedConflicts = await this.resolveConflicts(conflicts, options.conflictResolutionStrategy)
      }

      // Notify about conflicts
      if (conflicts.length > 0) {
        this.notifyConflicts(conflicts)
      }

      this.lastSyncTime = Date.now()

      return {
        success: true,
        conflicts,
        resolvedConflicts,
        errors: [],
        lastSyncTime: this.lastSyncTime
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      
      errorLogger.logError(error, {
        operation: 'state_sync',
        timestamp: Date.now(),
        additionalData: {
          canvasId,
          localObjectCount: localObjects.length,
          syncDuration: Date.now() - startTime
        }
      })

      return {
        success: false,
        conflicts: [],
        resolvedConflicts: [],
        errors: [errorMessage],
        lastSyncTime: this.lastSyncTime
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Detect conflicts between local and server state
   */
  private detectConflicts(localObjects: CanvasObject[], serverObjects: CanvasObject[]): StateConflict[] {
    const conflicts: StateConflict[] = []
    const serverObjectMap = new Map(serverObjects.map(obj => [obj.id, obj]))
    const localObjectMap = new Map(localObjects.map(obj => [obj.id, obj]))

    // Check for conflicts in existing objects
    for (const localObject of localObjects) {
      const serverObject = serverObjectMap.get(localObject.id)
      
      if (!serverObject) {
        // Object exists locally but not on server (deletion conflict)
        conflicts.push({
          objectId: localObject.id,
          localObject,
          serverObject: localObject, // Use local as placeholder
          conflictType: 'deletion',
          timestamp: Date.now(),
          severity: 'high'
        })
        continue
      }

      // Check for property conflicts
      const propertyConflicts = this.detectPropertyConflicts(localObject, serverObject)
      if (propertyConflicts.length > 0) {
        conflicts.push({
          objectId: localObject.id,
          localObject,
          serverObject,
          conflictType: 'properties',
          timestamp: Date.now(),
          severity: this.calculateConflictSeverity(propertyConflicts)
        })
      }
    }

    // Check for objects that exist on server but not locally (creation conflict)
    for (const serverObject of serverObjects) {
      if (!localObjectMap.has(serverObject.id)) {
        conflicts.push({
          objectId: serverObject.id,
          localObject: serverObject, // Use server as placeholder
          serverObject,
          conflictType: 'creation',
          timestamp: Date.now(),
          severity: 'medium'
        })
      }
    }

    return conflicts
  }

  /**
   * Detect property conflicts between local and server objects
   */
  private detectPropertyConflicts(localObject: CanvasObject, serverObject: CanvasObject): string[] {
    const conflicts: string[] = []
    const localProps = localObject.properties
    const serverProps = serverObject.properties

    // Check critical properties
    const criticalProps = ['x', 'y', 'width', 'height', 'radius', 'text']
    
    for (const prop of criticalProps) {
      if (localProps[prop] !== undefined && serverProps[prop] !== undefined) {
        if (localProps[prop] !== serverProps[prop]) {
          conflicts.push(prop)
        }
      }
    }

    return conflicts
  }

  /**
   * Calculate conflict severity based on property conflicts
   */
  private calculateConflictSeverity(conflicts: string[]): 'low' | 'medium' | 'high' {
    const criticalProps = ['x', 'y', 'width', 'height']
    const hasCriticalConflicts = conflicts.some(prop => criticalProps.includes(prop))
    
    if (hasCriticalConflicts) return 'high'
    if (conflicts.length > 2) return 'medium'
    return 'low'
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflicts(
    conflicts: StateConflict[],
    strategy: SyncOptions['conflictResolutionStrategy'] = 'server_wins'
  ): Promise<StateConflict[]> {
    const resolvedConflicts: StateConflict[] = []

    for (const conflict of conflicts) {
      try {
        let resolvedObject: CanvasObject

        switch (strategy) {
          case 'server_wins':
            resolvedObject = conflict.serverObject
            break
          case 'client_wins':
            resolvedObject = conflict.localObject
            break
          case 'merge':
            resolvedObject = this.mergeObjects(conflict.localObject, conflict.serverObject)
            break
          case 'prompt_user':
            // This would typically show a UI dialog
            // For now, default to server_wins
            resolvedObject = conflict.serverObject
            break
          default:
            resolvedObject = conflict.serverObject
        }

        resolvedConflicts.push({
          ...conflict,
          localObject: resolvedObject
        })
      } catch (error) {
        console.error(`Failed to resolve conflict for object ${conflict.objectId}:`, error)
      }
    }

    return resolvedConflicts
  }

  /**
   * Merge two objects intelligently
   */
  private mergeObjects(localObject: CanvasObject, serverObject: CanvasObject): CanvasObject {
    // Use server object as base
    const merged = { ...serverObject }
    
    // Merge properties, preferring server values for critical properties
    const criticalProps = ['x', 'y', 'width', 'height', 'radius']
    const mergedProperties = { ...serverObject.properties }

    // Only merge non-critical properties from local if they're newer
    const localTimestamp = new Date(localObject.updated_at || localObject.created_at).getTime()
    const serverTimestamp = new Date(serverObject.updated_at || serverObject.created_at).getTime()

    if (localTimestamp > serverTimestamp) {
      for (const [key, value] of Object.entries(localObject.properties)) {
        if (!criticalProps.includes(key)) {
          mergedProperties[key] = value
        }
      }
    }

    merged.properties = mergedProperties
    return merged
  }

  /**
   * Register callback for conflict notifications
   */
  onConflict(callback: (conflicts: StateConflict[]) => void): void {
    this.conflictCallbacks.push(callback)
  }

  /**
   * Remove conflict callback
   */
  offConflict(callback: (conflicts: StateConflict[]) => void): void {
    const index = this.conflictCallbacks.indexOf(callback)
    if (index > -1) {
      this.conflictCallbacks.splice(index, 1)
    }
  }

  /**
   * Notify about conflicts
   */
  private notifyConflicts(conflicts: StateConflict[]): void {
    this.conflictCallbacks.forEach(callback => {
      try {
        callback(conflicts)
      } catch (error) {
        console.error('Error in conflict callback:', error)
      }
    })
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    lastSyncTime: number
    syncInProgress: boolean
    autoSyncActive: boolean
  } {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      autoSyncActive: this.syncInterval !== null
    }
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolutionStrategy(strategy: SyncOptions['conflictResolutionStrategy']): void {
    this.conflictResolutionStrategy = strategy
  }

  /**
   * Force refresh from server
   */
  async forceRefresh(canvasId: string): Promise<CanvasObject[]> {
    try {
      const response = await canvasAPI.getCanvasObjects(canvasId)
      this.lastSyncTime = Date.now()
      return response.objects
    } catch (error) {
      console.error('Force refresh failed:', error)
      throw error
    }
  }

  /**
   * Check if sync is needed
   */
  needsSync(thresholdMs: number = 60000): boolean {
    return Date.now() - this.lastSyncTime > thresholdMs
  }
}

// Create singleton instance
export const stateSyncManager = new StateSyncManager()
