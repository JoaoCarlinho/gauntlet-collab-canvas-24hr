import React, { useState, useEffect } from 'react'
import { Users, Eye, Edit3, Clock } from 'lucide-react'

interface PresenceUser {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  activity: 'viewing' | 'editing' | 'idle'
  last_seen: string
  timestamp: number
}

interface PresenceIndicatorsProps {
  canvasId: string
  currentUserId: string
  maxVisible?: number
  showTooltips?: boolean
}

const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  canvasId,
  currentUserId,
  maxVisible = 5,
  showTooltips = true
}) => {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // This would typically connect to a real-time presence service
    // For now, we'll simulate with mock data
    const mockUsers: PresenceUser[] = [
      {
        user_id: 'user1',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        status: 'online',
        activity: 'editing',
        last_seen: new Date().toISOString(),
        timestamp: Date.now()
      },
      {
        user_id: 'user2',
        user_name: 'Jane Smith',
        user_email: 'jane@example.com',
        status: 'online',
        activity: 'viewing',
        last_seen: new Date().toISOString(),
        timestamp: Date.now() - 1000
      }
    ]

    // Filter out current user and sort by activity
    const otherUsers = mockUsers
      .filter(user => user.user_id !== currentUserId)
      .sort((a, b) => {
        // Prioritize editing users, then viewing, then by timestamp
        const activityPriority = { editing: 3, viewing: 2, idle: 1 }
        const aPriority = activityPriority[a.activity] || 1
        const bPriority = activityPriority[b.activity] || 1
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        return b.timestamp - a.timestamp
      })

    setActiveUsers(otherUsers)
  }, [canvasId, currentUserId])

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'editing':
        return <Edit3 className="w-3 h-3" />
      case 'viewing':
        return <Eye className="w-3 h-3" />
      case 'idle':
        return <Clock className="w-3 h-3" />
      default:
        return <Eye className="w-3 h-3" />
    }
  }

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'editing':
        return 'bg-green-500'
      case 'viewing':
        return 'bg-blue-500'
      case 'idle':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const visibleUsers = isExpanded ? activeUsers : activeUsers.slice(0, maxVisible)
  const hiddenCount = activeUsers.length - maxVisible

  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      {/* User avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.user_id}
            className="relative group"
            style={{ zIndex: activeUsers.length - index }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 shadow-sm">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.user_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user.user_name)
              )}
            </div>
            
            {/* Status indicator */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
            
            {/* Activity indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getActivityColor(user.activity)} flex items-center justify-center`}>
              <div className="text-white">
                {getActivityIcon(user.activity)}
              </div>
            </div>
            
            {/* Tooltip */}
            {showTooltips && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="font-medium">{user.user_name}</div>
                <div className="text-gray-300 capitalize">
                  {user.activity === 'editing' ? 'Editing' : 
                   user.activity === 'viewing' ? 'Viewing' : 
                   user.activity === 'idle' ? 'Idle' : user.activity}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Show more indicator */}
      {hiddenCount > 0 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
        >
          +{hiddenCount}
        </button>
      )}
      
      {/* User count */}
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>{activeUsers.length}</span>
      </div>
      
      {/* Expanded view */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Active Users</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {activeUsers.map((user) => (
              <div key={user.user_id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.user_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.user_name)
                    )}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {user.user_name}
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    {getActivityIcon(user.activity)}
                    <span className="capitalize">
                      {user.activity === 'editing' ? 'Editing' : 
                       user.activity === 'viewing' ? 'Viewing' : 
                       user.activity === 'idle' ? 'Idle' : user.activity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PresenceIndicators
