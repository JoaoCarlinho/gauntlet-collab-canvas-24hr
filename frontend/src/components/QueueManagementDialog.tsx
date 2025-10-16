/**
 * Queue Management Dialog for detailed queue monitoring and control
 */

import React, { useState, useEffect } from 'react'
import { X, Clock, CheckCircle, XCircle, AlertTriangle, RotateCcw, Trash2, Play, Pause } from 'lucide-react'
import { updateQueueManager, QueuedUpdate, QueueStats } from '../services/updateQueueManager'

interface QueueManagementDialogProps {
  isOpen: boolean
  onClose: () => void
}

const QueueManagementDialog: React.FC<QueueManagementDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [stats, setStats] = useState<QueueStats>(updateQueueManager.getStats())
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const handleStatsChange = (newStats: QueueStats) => {
      setStats(newStats)
    }

    updateQueueManager.onStatsChange(handleStatsChange)

    // Initial stats
    setStats(updateQueueManager.getStats())

    return () => {
      updateQueueManager.offStatsChange(handleStatsChange)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !autoRefresh) return

    const interval = setInterval(() => {
      setStats(updateQueueManager.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, autoRefresh])

  if (!isOpen) return null

  const getUpdatesForTab = (): QueuedUpdate[] => {
    switch (selectedTab) {
      case 'pending':
        return updateQueueManager.getUpdatesByStatus('pending')
      case 'processing':
        return updateQueueManager.getUpdatesByStatus('processing')
      case 'completed':
        return Array.from(updateQueueManager['completed'].values())
      case 'failed':
        return updateQueueManager.getFailedUpdates()
      default:
        return []
    }
  }

  const getStatusIcon = (status: QueuedUpdate['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <X className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: QueuedUpdate['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const handleRetryFailed = (updateId: string) => {
    updateQueueManager.retryFailedUpdate(updateId)
  }

  const handleCancelUpdate = (updateId: string) => {
    updateQueueManager.cancelUpdate(updateId)
  }

  const handleRetryAllFailed = () => {
    const failedUpdates = updateQueueManager.getFailedUpdates()
    failedUpdates.forEach(update => {
      updateQueueManager.retryFailedUpdate(update.id)
    })
  }

  const handleClearCompleted = () => {
    updateQueueManager.clearCompleted()
  }

  const handleClearFailed = () => {
    updateQueueManager.clearFailed()
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire queue? This action cannot be undone.')) {
      updateQueueManager.clearQueue()
    }
  }

  const tabs = [
    { id: 'pending', label: 'Pending', count: stats.pending, color: 'text-yellow-600' },
    { id: 'processing', label: 'Processing', count: stats.processing, color: 'text-blue-600' },
    { id: 'completed', label: 'Completed', count: stats.completed, color: 'text-green-600' },
    { id: 'failed', label: 'Failed', count: stats.failed, color: 'text-red-600' }
  ] as const

  const updates = getUpdatesForTab()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Update Queue Management
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto refresh</span>
            </label>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            {tabs.map(tab => (
              <div key={tab.id} className="text-center">
                <div className={`text-2xl font-bold ${tab.color}`}>
                  {tab.count}
                </div>
                <div className="text-sm text-gray-600">{tab.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <div>Total queued: {stats.totalQueued}</div>
            <div>Queue size: {stats.queueSize}</div>
            <div>Avg wait time: {formatDuration(stats.averageWaitTime)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {updates.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {selectedTab} updates
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map(update => (
                <div
                  key={update.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(update.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">
                            Object {update.objectId.slice(0, 8)}...
                          </span>
                          <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(update.priority)}`}>
                            {update.priority}
                          </span>
                          <span className="text-sm text-gray-500">
                            {update.operation}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>ID: {update.id.slice(0, 12)}...</div>
                          <div>Queued: {formatTimestamp(update.timestamp)}</div>
                          {update.retryCount > 0 && (
                            <div>Retries: {update.retryCount}/{update.maxRetries}</div>
                          )}
                          {update.metadata?.userAction && (
                            <div>Action: {update.metadata.userAction}</div>
                          )}
                        </div>

                        {update.data && (
                          <div className="mt-2 text-xs text-gray-500">
                            <details>
                              <summary className="cursor-pointer">Data</summary>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(update.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {update.status === 'failed' && (
                        <button
                          onClick={() => handleRetryFailed(update.id)}
                          className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                          title="Retry"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      
                      {(update.status === 'pending' || update.status === 'processing') && (
                        <button
                          onClick={() => handleCancelUpdate(update.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {stats.failed > 0 && (
              <button
                onClick={handleRetryAllFailed}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry All Failed</span>
              </button>
            )}
            
            {stats.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Clear Completed
              </button>
            )}
            
            {stats.failed > 0 && (
              <button
                onClick={handleClearFailed}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Clear Failed
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueueManagementDialog
