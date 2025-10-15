// Utility functions for cursor and user management

export const getUserColor = (userId: string): string => {
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ]
  
  // Simple hash function to get consistent color for user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const getUserInitials = (name: string): string => {
  if (!name) return '?'
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getCursorIcon = (userId: string): string => {
  // Return a cursor icon based on user ID for variety
  const icons = ['👆', '👉', '👈', '👇', '👋', '✋', '🤚', '👌']
  
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return icons[Math.abs(hash) % icons.length]
}

export const formatLastActivity = (timestamp: string): string => {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)
  
  if (diffInSeconds < 5) return 'Just now'
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  return `${Math.floor(diffInSeconds / 3600)}h ago`
}

export const isUserActive = (timestamp: string): boolean => {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)
  
  // Consider user active if last activity was within 30 seconds
  return diffInSeconds < 30
}
