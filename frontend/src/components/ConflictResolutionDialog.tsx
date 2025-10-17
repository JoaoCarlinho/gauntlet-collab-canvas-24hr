/**
 * Conflict Resolution Dialog for handling state conflicts
 */

import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
// import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { StateConflict } from '../services/stateSyncManager'

interface ConflictResolutionDialogProps {
  isOpen: boolean
  conflicts: StateConflict[]
  onClose: () => void
  onResolve: (resolutions: ConflictResolution[]) => void
}

export interface ConflictResolution {
  conflictId: string
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'skip'
  resolvedObject?: any
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  conflicts,
  onClose,
  onResolve
}) => {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map())

  if (!isOpen || conflicts.length === 0) return null

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution['resolution']) => {
    setResolutions(prev => {
      const newMap = new Map(prev)
      newMap.set(conflictId, { conflictId, resolution })
      return newMap
    })
  }

  const handleResolveAll = () => {
    const resolutionArray = Array.from(resolutions.values())
    onResolve(resolutionArray)
    setResolutions(new Map())
    onClose()
  }

  const handleResolveAllServer = () => {
    const resolutionArray = conflicts.map(conflict => ({
      conflictId: conflict.objectId,
      resolution: 'server_wins' as const
    }))
    onResolve(resolutionArray)
    setResolutions(new Map())
    onClose()
  }

  const handleResolveAllClient = () => {
    const resolutionArray = conflicts.map(conflict => ({
      conflictId: conflict.objectId,
      resolution: 'client_wins' as const
    }))
    onResolve(resolutionArray)
    setResolutions(new Map())
    onClose()
  }

  const getSeverityColor = (severity: StateConflict['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getConflictTypeIcon = (type: StateConflict['conflictType']) => {
    switch (type) {
      case 'position': return '📍'
      case 'properties': return '⚙️'
      case 'deletion': return '🗑️'
      case 'creation': return '➕'
      default: return '❓'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              State Conflicts Detected
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-gray-600">
              The following objects have conflicts between your local changes and the server state. 
              Choose how to resolve each conflict:
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex space-x-3">
            <button
              onClick={handleResolveAllServer}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Use Server Version (All)
            </button>
            <button
              onClick={handleResolveAllClient}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Keep Local Changes (All)
            </button>
          </div>

          {/* Conflicts List */}
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.objectId}
                className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getConflictTypeIcon(conflict.conflictType)}</span>
                    <div>
                      <h3 className="font-medium">
                        Object {conflict.objectId.slice(0, 8)}...
                      </h3>
                      <p className="text-sm opacity-75">
                        {conflict.conflictType} conflict • {conflict.severity} severity
                      </p>
                    </div>
                  </div>
                  <span className="text-xs opacity-75">
                    {new Date(conflict.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Conflict Details */}
                <div className="mb-4 text-sm">
                  {conflict.conflictType === 'position' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Local Position:</strong>
                        <p>x: {conflict.localObject.properties.x}, y: {conflict.localObject.properties.y}</p>
                      </div>
                      <div>
                        <strong>Server Position:</strong>
                        <p>x: {conflict.serverObject.properties.x}, y: {conflict.serverObject.properties.y}</p>
                      </div>
                    </div>
                  )}
                  
                  {conflict.conflictType === 'properties' && (
                    <div>
                      <strong>Property Differences:</strong>
                      <p className="mt-1">
                        Local: {JSON.stringify(conflict.localObject.properties, null, 2)}
                      </p>
                      <p className="mt-1">
                        Server: {JSON.stringify(conflict.serverObject.properties, null, 2)}
                      </p>
                    </div>
                  )}

                  {conflict.conflictType === 'deletion' && (
                    <p>This object was deleted on the server but still exists locally.</p>
                  )}

                  {conflict.conflictType === 'creation' && (
                    <p>This object was created on the server but doesn't exist locally.</p>
                  )}
                </div>

                {/* Resolution Options */}
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`resolution-${conflict.objectId}`}
                      value="server_wins"
                      checked={resolutions.get(conflict.objectId)?.resolution === 'server_wins'}
                      onChange={() => handleResolutionChange(conflict.objectId, 'server_wins')}
                      className="text-blue-500"
                    />
                    <span className="text-sm">Use Server Version</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`resolution-${conflict.objectId}`}
                      value="client_wins"
                      checked={resolutions.get(conflict.objectId)?.resolution === 'client_wins'}
                      onChange={() => handleResolutionChange(conflict.objectId, 'client_wins')}
                      className="text-green-500"
                    />
                    <span className="text-sm">Keep Local Changes</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`resolution-${conflict.objectId}`}
                      value="merge"
                      checked={resolutions.get(conflict.objectId)?.resolution === 'merge'}
                      onChange={() => handleResolutionChange(conflict.objectId, 'merge')}
                      className="text-purple-500"
                    />
                    <span className="text-sm">Merge (Smart)</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`resolution-${conflict.objectId}`}
                      value="skip"
                      checked={resolutions.get(conflict.objectId)?.resolution === 'skip'}
                      onChange={() => handleResolutionChange(conflict.objectId, 'skip')}
                      className="text-gray-500"
                    />
                    <span className="text-sm">Skip</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {resolutions.size} of {conflicts.length} conflicts resolved
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveAll}
              disabled={resolutions.size === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Resolve Selected ({resolutions.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConflictResolutionDialog
