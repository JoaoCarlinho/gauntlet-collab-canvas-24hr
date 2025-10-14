import React, { createContext, useContext, useEffect, useState } from 'react'
import { socketService } from '../services/socket'
import { useAuth } from './useAuth'

interface SocketContextType {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  const connect = () => {
    const idToken = localStorage.getItem('idToken')
    if (idToken && isAuthenticated) {
      socketService.connect(idToken)
      setIsConnected(true)
    }
  }

  const disconnect = () => {
    socketService.disconnect()
    setIsConnected(false)
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)

    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
    }
  }, [])

  const value: SocketContextType = {
    isConnected,
    connect,
    disconnect,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
