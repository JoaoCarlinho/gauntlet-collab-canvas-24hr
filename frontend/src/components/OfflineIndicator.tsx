/**
 * Offline Indicator Component
 */

import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'
// import { CheckCircle, Clock } from 'lucide-react';
import { offlineManager, OfflineState } from '../services/offlineManager'

interface OfflineIndicatorProps {
  showDetails?: boolean
  className?: string
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [state, setState] = useState<OfflineState>(offlineManager.getState())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleStateUpdate = () => {
      setState(offlineManager.getState())
    }

    const handleOffline = () => {
      setState(offlineManager.getState())
    }

    const handleOnline = () => {
      setState(offlineManager.getState())
    }

    const handleRefreshCwStarted = () => {
      setState(offlineManager.getState())
    }

    const handleRefreshCwCompleted = () => {
      setState(offlineManager.getState())
    }

    // Listen to offline manager events
    offlineManager.on('offline', handleOffline)
    offlineManager.on('online', handleOnline)
    offlineManager.on('sync_started', handleRefreshCwStarted)
    offlineManager.on('sync_completed', handleRefreshCwCompleted)
    offlineManager.on('offline_update_added', handleStateUpdate)
    offlineManager.on('update_synced', handleStateUpdate)

    // Initial state
    setState(offlineManager.getState())

    return () => {
      offlineManager.off('offline', handleOffline)
      offlineManager.off('online', handleOnline)
      offlineManager.off('sync_started', handleRefreshCwStarted)
      offlineManager.off('sync_completed', handleRefreshCwCompleted)
      offlineManager.off('offline_update_added', handleStateUpdate)
      offlineManager.off('update_synced', handleStateUpdate)
    }
  }, [])

  const getStatusColor = () => {
    if (state.isOffline) return 'text-red-500'
    if (state.syncInProgress) return 'text-blue-500'
    if (state.pendingUpdates.length > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (state.isOffline) {
      return <WifiOff className="h-4 w-4" />
    }
    if (state.syncInProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    if (state.pendingUpdates.length > 0) {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <Wifi className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (state.isOffline) {
      return 'Offline'
    }
    if (state.syncInProgress) {
      return 'RefreshCwing...'
    }
    if (state.pendingUpdates.length > 0) {
      return `${state.pendingUpdates.length} pending`
    }
    return 'Online'
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`
    return `${Math.round(ms / 3600000)}h`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const handleForceRefreshCw = () => {
        offlineManager.forceSync()
  }

  const handleClearOfflineData = () => {
    if (window.confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      offlineManager.clearOfflineData()
    }
  }

  const getPendingUpdatesByType = () => {
    const types = state.pendingUpdates.reduce((acc, update) => {
      acc[update.type] = (acc[update.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return types
  }

  const getPendingUpdatesByPriority = () => {
    const priorities = state.pendingUpdates.reduce((acc, update) => {
      acc[update.priority] = (acc[update.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return priorities
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <div 
        className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors ${getStatusColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
          {state.isOffline && (
            <span className="text-xs opacity-75">
              {formatDuration(state.offlineDuration)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && showDetails && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 z-50">
          <div className="space-y-4">
            {/* Connection Status */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Connection Status</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${getStatusColor()}`}>
                    {state.isOffline ? 'Offline' : 'Online'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Online:</span>
                  <span className="font-medium">{formatTime(state.lastOnline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Offline Duration:</span>
                  <span className="font-medium">{formatDuration(state.offlineDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>RefreshCw Status:</span>
                  <span className="font-medium">
                    {state.syncInProgress ? 'In Progress' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pending Updates */}
            {state.pendingUpdates.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Pending Updates</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Total Pending:</span>
                      <span className="font-medium">{state.pendingUpdates.length}</span>
                    </div>
                  </div>
                  
                  {/* Updates by Type */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">By Type:</div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {Object.entries(getPendingUpdatesByType()).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Updates by Priority */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">By Priority:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(getPendingUpdatesByPriority()).map(([priority, count]) => (
                        <div key={priority} className="flex justify-between">
                          <span className="capitalize">{priority}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cached Objects */}
            {state.cachedObjects.size > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cached Objects</h3>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Cached Objects:</span>
                    <span className="font-medium">{state.cachedObjects.size}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Offline Time:</span>
                  <span className="font-medium">{formatDuration(state.totalOfflineTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Operations:</span>
                  <span className="font-medium">{state.totalSyncOperations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successful Syncs:</span>
                  <span className="font-medium text-green-600">{state.successfulSyncs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Syncs:</span>
                  <span className="font-medium text-red-600">{state.failedSyncs}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {!state.isOffline && state.pendingUpdates.length > 0 && (
                <button
                  onClick={handleForceRefreshCw}
                  disabled={state.syncInProgress}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Force Sync</span>
                </button>
              )}
              
              {state.pendingUpdates.length > 0 && (
                <button
                  onClick={handleClearOfflineData}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Clear Data
                </button>
              )}
            </div>

            {/* Status Message */}
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {state.isOffline ? (
                'You are currently offline. Changes will be saved locally and synced when connection is restored.'
              ) : state.pendingUpdates.length > 0 ? (
                'Some changes are pending sync. They will be synchronized automatically.'
              ) : (
                'All changes are synchronized. You are fully online.'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator
