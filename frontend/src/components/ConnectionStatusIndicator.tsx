/**
 * Connection Status Indicator Component
 */

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'
// import { Clock, Activity } from 'lucide-react';
import { connectionMonitor, ConnectionStatus } from '../services/connectionMonitor'

interface ConnectionStatusIndicatorProps {
  showDetails?: boolean
  className?: string
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(connectionMonitor.getStatus())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleStatusUpdate = () => {
      setStatus(connectionMonitor.getStatus())
    }

    const handleConnect = () => {
      setStatus(connectionMonitor.getStatus())
    }

    const handleDisconnect = () => {
      setStatus(connectionMonitor.getStatus())
    }

    const handleQualityChange = () => {
      setStatus(connectionMonitor.getStatus())
    }

    // Listen to connection events
    connectionMonitor.on('connect', handleConnect)
    connectionMonitor.on('disconnect', handleDisconnect)
    connectionMonitor.on('quality_change', handleQualityChange)
    connectionMonitor.on('latency_update', handleStatusUpdate)

    // Initial status
    setStatus(connectionMonitor.getStatus())

    return () => {
      connectionMonitor.off('connect', handleConnect)
      connectionMonitor.off('disconnect', handleDisconnect)
      connectionMonitor.off('quality_change', handleQualityChange)
      connectionMonitor.off('latency_update', handleStatusUpdate)
    }
  }, [])

  const getStatusColor = () => {
    if (!status.isConnected) return 'text-red-500'
    
    switch (status.networkQuality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = () => {
    if (!status.isConnected) {
      return <WifiOff className="h-4 w-4" />
    }
    
    switch (status.networkQuality) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />
      case 'good': return <Wifi className="h-4 w-4" />
      case 'fair': return <AlertTriangle className="h-4 w-4" />
      case 'poor': return <AlertTriangle className="h-4 w-4" />
      default: return <Wifi className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    if (!status.isConnected) {
      return 'Disconnected'
    }
    
    return status.networkQuality.charAt(0).toUpperCase() + status.networkQuality.slice(1)
  }

  const formatUptime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`
    return `${Math.round(ms / 3600000)}h`
  }

  const formatLatency = (ms: number) => {
    return `${Math.round(ms)}ms`
  }

  const getQualityDescription = (quality: ConnectionStatus['networkQuality']) => {
    switch (quality) {
      case 'excellent': return 'Excellent connection quality'
      case 'good': return 'Good connection quality'
      case 'fair': return 'Fair connection quality'
      case 'poor': return 'Poor connection quality'
      case 'offline': return 'No connection'
      default: return 'Unknown connection quality'
    }
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
          {status.isConnected && (
            <span className="text-xs opacity-75">
              {formatLatency(status.latency)}
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
                    {status.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{status.connectionType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className={`font-medium ${getStatusColor()}`}>
                    {status.networkQuality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stability:</span>
                  <span className="font-medium">
                    {Math.round(status.connectionStability)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Network Metrics */}
            {status.isConnected && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Network Metrics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="font-medium">{formatLatency(status.latency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className="font-medium">{formatLatency(status.averageLatency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packet Loss:</span>
                    <span className="font-medium">{status.packetLoss.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bandwidth:</span>
                    <span className="font-medium">
                      {status.bandwidth > 0 ? `${(status.bandwidth / 1000).toFixed(1)} Mbps` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Statistics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{formatUptime(status.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Connections:</span>
                  <span className="font-medium">{status.totalConnections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Disconnections:</span>
                  <span className="font-medium">{status.totalDisconnections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconnect Attempts:</span>
                  <span className="font-medium">
                    {status.reconnectAttempts}/{status.maxReconnectAttempts}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Description */}
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {getQualityDescription(status.networkQuality)}
            </div>

            {/* Last Events */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Recent Events</h3>
              <div className="space-y-1 text-xs">
                {connectionMonitor.getEvents(5).slice().reverse().map((event, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="capitalize">{event.type}</span>
                    <span className="text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatusIndicator
