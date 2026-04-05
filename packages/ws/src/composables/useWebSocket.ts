/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, onUnmounted } from 'vue'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WebSocketMessage {
  data: string | ArrayBuffer | Blob
  timestamp: number
}

export interface UseWebSocketReturn {
  /** Reactive list of received messages */
  messages: ReturnType<typeof ref<WebSocketMessage[]>>
  /** Whether the socket is currently connected */
  isConnected: ReturnType<typeof ref<boolean>>
  /** Send a message (string or object serialized to JSON) */
  send: (data: string | Record<string, unknown>) => void
  /** Manually open the connection */
  connect: () => void
  /** Manually close the connection */
  disconnect: () => void
}

// ─── useWebSocket ─────────────────────────────────────────────────────────────

/**
 * `useWebSocket(path)` — Vue composable for reactive WebSocket connections.
 *
 * Features:
 * - Reactive `messages` array and `isConnected` boolean
 * - Auto-reconnect on close with exponential backoff (max 30s)
 * - Cleans up on component unmount
 *
 * @example
 * const { messages, isConnected, send } = useWebSocket('/ws/chat')
 */
export function useWebSocket(path: string): UseWebSocketReturn {
  const messages = ref<WebSocketMessage[]>([])
  const isConnected = ref(false)

  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let manualClose = false

  function buildUrl(p: string): string {
    if (typeof window === 'undefined') return p
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const normalised = p.startsWith('/') ? p : `/${p}`
    return `${protocol}//${host}${normalised}`
  }

  function connect(): void {
    if (typeof window === 'undefined') return
    manualClose = false

    const url = buildUrl(path)
    socket = new WebSocket(url)

    socket.onopen = () => {
      isConnected.value = true
      reconnectAttempts = 0
    }

    socket.onmessage = (event: MessageEvent) => {
      messages.value.push({ data: event.data as string | ArrayBuffer | Blob, timestamp: Date.now() })
    }

    socket.onclose = () => {
      isConnected.value = false
      socket = null

      if (!manualClose) {
        scheduleReconnect()
      }
    }

    socket.onerror = () => {
      // onclose fires after onerror — reconnect handled there
      isConnected.value = false
    }
  }

  function scheduleReconnect(): void {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (cap)
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30_000)
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      connect()
    }, delay)
  }

  function disconnect(): void {
    manualClose = true
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    socket?.close()
    socket = null
    isConnected.value = false
  }

  function send(data: string | Record<string, unknown>): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    socket.send(payload)
  }

  // Auto-connect on composable creation (client-side only)
  if (typeof window !== 'undefined') {
    connect()
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return { messages, isConnected, send, connect, disconnect }
}
