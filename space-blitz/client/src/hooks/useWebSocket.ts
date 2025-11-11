import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null
}

export const useWebSocket = (url: string = 'http://localhost:3001'): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('WebSocket connected')
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('WebSocket disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`)
      console.error('WebSocket connection error:', err)
    })

    socket.on('error', (err) => {
      setError(`WebSocket error: ${err}`)
      console.error('WebSocket error:', err)
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [url])

  return {
    socket: socketRef.current,
    isConnected,
    error
  }
}