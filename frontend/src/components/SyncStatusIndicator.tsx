/**
 * Sync Status Indicator for showing state synchronization status
 */

import React from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'

export interface SyncStatus {
  isConnected: boolean
  lastSyncTime: number
  syncInProgress: boolean
  hasConflicts: boolean
  conflictCount: number
  autoSyncActive: boolean
}

interface SyncStatusIndicatorProps {
  status: SyncStatus
  onManualSync?: () => void
  onShowConflicts?: () => void
  className?: string
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  onManualSync,
  onShowConflicts,
  className = ''
}) => {
  const getStatusColor = () => {
    if (!status.isConnected) return 'text-red-500'
    if (status.hasConflicts) return 'text-yellow-500'
    if (status.syncInProgress) return 'text-blue-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!status.isConnected) return <XCircle className="h-4 w-4" />
    if (status.hasConflicts) return <AlertTriangle className="h-4 w-4" />
    if (status.syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!status.isConnected) return 'Disconnected'
    if (status.hasConflicts) return `${status.conflictCount} conflicts`
    if (status.syncInProgress) return 'Syncing...'
    return 'Synced'
  }

  const getLastSyncText = () => {
    if (status.lastSyncTime === 0) return 'Never synced'
    
    const now = Date.now()
    const diff = now - status.lastSyncTime
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(status.lastSyncTime).toLocaleDateString()
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Icon */}
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>

      {/* Status Text */}
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <span className="text-xs text-gray-500">
          {getLastSyncText()}
        </span>
      </div>

      {/* Auto Sync Indicator */}
      {status.autoSyncActive && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Auto</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        {onManualSync && (
          <button
            onClick={onManualSync}
            disabled={status.syncInProgress}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Manual sync"
          >
            <RefreshCw className={`h-3 w-3 ${status.syncInProgress ? 'animate-spin' : ''}`} />
          </button>
        )}

        {onShowConflicts && status.hasConflicts && (
          <button
            onClick={onShowConflicts}
            className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors"
            title="Show conflicts"
          >
            <AlertTriangle className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

export default SyncStatusIndicator
