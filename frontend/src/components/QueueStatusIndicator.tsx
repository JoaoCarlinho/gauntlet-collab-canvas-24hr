/**
 * Queue Status Indicator for showing update queue status
 */

import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle, Pause, Play, RotateCcw } from 'lucide-react'
import { QueueStats } from '../services/updateQueueManager'

interface QueueStatusIndicatorProps {
  stats: QueueStats
  onShowQueue?: () => void
  onRetryFailed?: () => void
  onClearCompleted?: () => void
  onClearFailed?: () => void
  className?: string
}

const QueueStatusIndicator: React.FC<QueueStatusIndicatorProps> = ({
  stats,
  onShowQueue,
  onRetryFailed,
  onClearCompleted,
  onClearFailed,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = () => {
    if (stats.failed > 0) return 'text-red-500'
    if (stats.processing > 0) return 'text-blue-500'
    if (stats.pending > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (stats.failed > 0) return <XCircle className="h-4 w-4" />
    if (stats.processing > 0) return <Clock className="h-4 w-4 animate-pulse" />
    if (stats.pending > 0) return <Clock className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (stats.failed > 0) return `${stats.failed} failed`
    if (stats.processing > 0) return `${stats.processing} processing`
    if (stats.pending > 0) return `${stats.pending} queued`
    return 'Queue empty'
  }

  const formatWaitTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
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
          {stats.pending > 0 && (
            <span className="text-xs opacity-75">
              Avg wait: {formatWaitTime(stats.averageWaitTime)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64 z-50">
          <div className="space-y-3">
            {/* Queue Summary */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Update Queue Status</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium text-yellow-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing:</span>
                  <span className="font-medium text-blue-600">{stats.processing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{stats.failed}</span>
                </div>
              </div>
            </div>

            {/* Oldest Pending */}
            {stats.oldestPending && (
              <div className="text-sm">
                <span className="text-gray-600">Oldest pending:</span>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                  <div>Object: {stats.oldestPending.objectId.slice(0, 8)}...</div>
                  <div>Operation: {stats.oldestPending.operation}</div>
                  <div>Wait time: {formatWaitTime(Date.now() - stats.oldestPending.timestamp)}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {onShowQueue && (
                <button
                  onClick={onShowQueue}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  View Queue
                </button>
              )}

              {stats.failed > 0 && onRetryFailed && (
                <button
                  onClick={onRetryFailed}
                  className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Retry Failed</span>
                </button>
              )}

              {stats.completed > 0 && onClearCompleted && (
                <button
                  onClick={onClearCompleted}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  Clear Completed
                </button>
              )}

              {stats.failed > 0 && onClearFailed && (
                <button
                  onClick={onClearFailed}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Clear Failed
                </button>
              )}
            </div>

            {/* Performance Stats */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <div>Total queued: {stats.totalQueued}</div>
              <div>Queue size: {stats.queueSize}</div>
              {stats.averageWaitTime > 0 && (
                <div>Avg wait: {formatWaitTime(stats.averageWaitTime)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueueStatusIndicator
