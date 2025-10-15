import React, { useState, useEffect } from 'react'
import { ChevronDown, Circle, Clock, AlertCircle, X } from 'lucide-react'

interface UserStatusProps {
  onStatusChange?: (status: string) => void
  compact?: boolean
}

const UserStatus: React.FC<UserStatusProps> = ({
  onStatusChange,
  compact = false
}) => {
  const [currentStatus, setCurrentStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const statusOptions = [
    {
      value: 'online',
      label: 'Available',
      description: 'Active and available',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: Circle,
      dotColor: 'bg-green-500'
    },
    {
      value: 'away',
      label: 'Away',
      description: 'Away from keyboard',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: Clock,
      dotColor: 'bg-yellow-500'
    },
    {
      value: 'busy',
      label: 'Busy',
      description: 'Do not disturb',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: AlertCircle,
      dotColor: 'bg-red-500'
    },
    {
      value: 'offline',
      label: 'Offline',
      description: 'Appear offline',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: X,
      dotColor: 'bg-gray-500'
    }
  ]

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus)

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Here you would typically call an API to update the user's status
      // await presenceAPI.updateUserStatus(userId, canvasId, newStatus)
      
      setCurrentStatus(newStatus as any)
      setIsDropdownOpen(false)
      
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      
      // Show success feedback
      console.log(`Status updated to: ${newStatus}`)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.status-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  if (compact) {
    return (
      <div className="relative status-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          onKeyDown={handleKeyDown}
        >
          <div className={`w-2 h-2 rounded-full ${currentStatusOption?.dotColor}`} />
          <span className="text-sm text-gray-600">{currentStatusOption?.label}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="py-1">
              {statusOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      currentStatus === option.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.dotColor}`} />
                    <IconComponent className={`w-4 h-4 ${option.color}`} />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative status-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg border transition-colors ${
          currentStatusOption?.bgColor
        } ${currentStatusOption?.color} hover:opacity-80`}
        onKeyDown={handleKeyDown}
      >
        <div className={`w-3 h-3 rounded-full ${currentStatusOption?.dotColor}`} />
        <div className="flex items-center space-x-2">
          {currentStatusOption && (
            <>
              <currentStatusOption.icon className="w-4 h-4" />
              <span className="font-medium">{currentStatusOption.label}</span>
            </>
          )}
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Set Status
            </div>
            <div className="space-y-1">
              {statusOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 transition-colors ${
                      currentStatus === option.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.dotColor}`} />
                    <IconComponent className={`w-4 h-4 ${option.color}`} />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserStatus
