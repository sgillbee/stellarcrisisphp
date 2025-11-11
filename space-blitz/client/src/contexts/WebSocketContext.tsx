import React, { createContext, useContext, ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { useWebSocket } from '../hooks/useWebSocket'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  error: string | null
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
  url?: string
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'http://localhost:3001'
}) => {
  const webSocketData = useWebSocket(url)

  return (
    <WebSocketContext.Provider value={webSocketData}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}