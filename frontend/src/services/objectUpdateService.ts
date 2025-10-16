/**
 * Object Update Service with Socket and REST API fallback
 */

import { socketService } from './socket'
import { objectsAPI } from './api'
import { retryWithBackoff, isRetryableError, RETRY_PRESETS } from '../utils/retryLogic'
import { errorLogger } from '../utils/errorLogger'
import { CanvasObject } from '../types'

export interface UpdateResult {
  success: boolean
  method: 'socket' | 'rest' | 'failed'
  error?: any
  object?: CanvasObject
  attempts: number
  totalTime: number
}

export interface UpdateOptions {
  useOptimisticUpdate?: boolean
  retryOptions?: any
  onProgress?: (attempt: number, method: string) => void
}

class ObjectUpdateService {
  private pendingUpdates = new Map<string, Promise<UpdateResult>>()
  private optimisticStates = new Map<string, any>()

  /**
   * Update object position with socket fallback to REST API
   */
  async updateObjectPosition(
    canvasId: string,
    idToken: string,
    objectId: string,
    x: number,
    y: number,
    options: UpdateOptions = {}
  ): Promise<UpdateResult> {
    const updateKey = `${objectId}_position`
    
    // Prevent duplicate updates for the same object
    if (this.pendingUpdates.has(updateKey)) {
      return this.pendingUpdates.get(updateKey)!
    }

    const updatePromise = this.performUpdate(
      canvasId,
      idToken,
      objectId,
      { x, y },
      options
    )

    this.pendingUpdates.set(updateKey, updatePromise)
    
    try {
      const result = await updatePromise
      return result
    } finally {
      this.pendingUpdates.delete(updateKey)
    }
  }

  /**
   * Update object properties with socket fallback to REST API
   */
  async updateObjectProperties(
    canvasId: string,
    idToken: string,
    objectId: string,
    properties: Record<string, any>,
    options: UpdateOptions = {}
  ): Promise<UpdateResult> {
    const updateKey = `${objectId}_properties`
    
    // Prevent duplicate updates for the same object
    if (this.pendingUpdates.has(updateKey)) {
      return this.pendingUpdates.get(updateKey)!
    }

    const updatePromise = this.performUpdate(
      canvasId,
      idToken,
      objectId,
      properties,
      options
    )

    this.pendingUpdates.set(updateKey, updatePromise)
    
    try {
      const result = await updatePromise
      return result
    } finally {
      this.pendingUpdates.delete(updateKey)
    }
  }

  /**
   * Perform the actual update with fallback logic
   */
  private async performUpdate(
    canvasId: string,
    idToken: string,
    objectId: string,
    properties: Record<string, any>,
    options: UpdateOptions
  ): Promise<UpdateResult> {
    const { useOptimisticUpdate = true, retryOptions = RETRY_PRESETS.QUICK, onProgress } = options

    // Store optimistic state if enabled
    if (useOptimisticUpdate) {
      this.optimisticStates.set(objectId, { ...properties, timestamp: Date.now() })
    }

    // Try socket update first
    const socketResult = await this.trySocketUpdate(canvasId, idToken, objectId, properties, retryOptions, onProgress)
    
    if (socketResult.success) {
      this.optimisticStates.delete(objectId)
      return socketResult
    }

    // Fallback to REST API
    const restResult = await this.tryRestUpdate(canvasId, idToken, objectId, properties, retryOptions, onProgress)
    
    if (restResult.success) {
      this.optimisticStates.delete(objectId)
      return restResult
    }

    // Both methods failed
    this.optimisticStates.delete(objectId)
    
    // Log the failure
    errorLogger.logError(restResult.error, {
      operation: 'object_update',
      objectId,
      timestamp: Date.now(),
      additionalData: {
        socketAttempts: socketResult.attempts,
        restAttempts: restResult.attempts,
        properties
      }
    })

    return {
      success: false,
      method: 'failed',
      error: restResult.error,
      attempts: socketResult.attempts + restResult.attempts,
      totalTime: socketResult.totalTime + restResult.totalTime
    }
  }

  /**
   * Try socket update with retry logic
   */
  private async trySocketUpdate(
    canvasId: string,
    idToken: string,
    objectId: string,
    properties: Record<string, any>,
    retryOptions: any,
    onProgress?: (attempt: number, method: string) => void
  ): Promise<UpdateResult> {
    return retryWithBackoff(async () => {
      // Check if socket is connected
      if (!socketService.isConnected()) {
        throw new Error('Socket not connected')
      }

      onProgress?.(1, 'socket')

      // Create a promise that resolves when the socket update succeeds or fails
      return new Promise<CanvasObject>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket update timeout'))
        }, 5000) // 5 second timeout

        // Listen for success
        const onSuccess = (data: { object: CanvasObject }) => {
          if (data.object.id === objectId) {
            clearTimeout(timeout)
            socketService.off('object_updated', onSuccess)
            socketService.off('object_update_failed', onFailure)
            resolve(data.object)
          }
        }

        // Listen for failure
        const onFailure = (data: { object_id: string; error: any }) => {
          if (data.object_id === objectId) {
            clearTimeout(timeout)
            socketService.off('object_updated', onSuccess)
            socketService.off('object_update_failed', onFailure)
            reject(new Error(data.error?.message || 'Socket update failed'))
          }
        }

        // Set up listeners
        socketService.on('object_updated', onSuccess)
        socketService.on('object_update_failed', onFailure)

        // Send the update
        socketService.updateObject(canvasId, idToken, objectId, properties)
      })
    }, retryOptions).then(result => ({
      success: true,
      method: 'socket' as const,
      object: result.data,
      attempts: result.attempts,
      totalTime: result.totalTime
    })).catch(error => ({
      success: false,
      method: 'socket' as const,
      error,
      attempts: 1,
      totalTime: 0
    }))
  }

  /**
   * Try REST API update with retry logic
   */
  private async tryRestUpdate(
    canvasId: string,
    idToken: string,
    objectId: string,
    properties: Record<string, any>,
    retryOptions: any,
    onProgress?: (attempt: number, method: string) => void
  ): Promise<UpdateResult> {
    return retryWithBackoff(async () => {
      onProgress?.(1, 'rest')
      const response = await objectsAPI.updateObject(objectId, { properties })
      return response.object
    }, retryOptions).then(result => ({
      success: true,
      method: 'rest' as const,
      object: result.data,
      attempts: result.attempts,
      totalTime: result.totalTime
    })).catch(error => ({
      success: false,
      method: 'rest' as const,
      error,
      attempts: 1,
      totalTime: 0
    }))
  }

  /**
   * Get optimistic state for an object
   */
  getOptimisticState(objectId: string): any {
    return this.optimisticStates.get(objectId)
  }

  /**
   * Clear optimistic state for an object
   */
  clearOptimisticState(objectId: string): void {
    this.optimisticStates.delete(objectId)
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): string[] {
    return Array.from(this.pendingUpdates.keys())
  }

  /**
   * Clear all pending updates (useful for cleanup)
   */
  clearPendingUpdates(): void {
    this.pendingUpdates.clear()
  }

  /**
   * Clear all optimistic states (useful for cleanup)
   */
  clearOptimisticStates(): void {
    this.optimisticStates.clear()
  }
}

// Create singleton instance
export const objectUpdateService = new ObjectUpdateService()
