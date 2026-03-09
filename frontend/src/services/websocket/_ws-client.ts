type WsEventMap = {
  open: void
  close: void
  error: Event
  message: unknown
}

type WsListener<K extends keyof WsEventMap> = (data: WsEventMap[K]) => void

export class WsClient {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<WsListener<keyof WsEventMap>>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private shouldReconnect = false
  private reconnectDelay = 2000
  private path: string

  constructor(path: string) {
    this.path = path
  }

  connect(token: string): void {
    this.shouldReconnect = true
    this._connect(token)
    this._startHeartbeat()
  }

  private _connect(token: string): void {
    // Определяем протокол WebSocket (wss для https, ws для http)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Собираем URL, используя хост текущей страницы. Это гарантирует, что мы всегда
    // обращаемся к прокси-серверу Vite, который и перенаправит запрос на бэкенд.
    const url = `${protocol}//${window.location.host}${this.path}?token=${encodeURIComponent(token)}`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectDelay = 2000
      this._emit('open', undefined)
    }

    this.ws.onclose = () => {
      this._emit('close', undefined)
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000)
          this._connect(token)
        }, this.reconnectDelay)
      }
    }

    this.ws.onerror = (e) => this._emit('error', e)

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as unknown
        this._emit('message', data)
      } catch {
        // ignore malformed
      }
    }
  }

  send(data: unknown): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
      return true
    }
    return false
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this._stopHeartbeat()
    this.ws?.close()
    this.ws = null
  }

  on<K extends keyof WsEventMap>(event: K, listener: WsListener<K>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener as WsListener<keyof WsEventMap>)
  }

  off<K extends keyof WsEventMap>(event: K, listener: WsListener<K>): void {
    this.listeners.get(event)?.delete(listener as WsListener<keyof WsEventMap>)
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private _emit<K extends keyof WsEventMap>(event: K, data: WsEventMap[K]): void {
    this.listeners.get(event)?.forEach((l) => l(data))
  }

  private _startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, 25_000)
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
  }
}
