export type SseMessageHandler<T = unknown> = (data: T) => void

export class SseClient<T = unknown> {
  private es: EventSource | null = null
  private onMessage: SseMessageHandler<T>
  private path: string
  private tokenProvider: (() => string | null | undefined) | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 2000
  private shouldReconnect = false

  constructor(path: string, onMessage: SseMessageHandler<T>) {
    this.path = path
    this.onMessage = onMessage
  }

  connect(tokenProvider: () => string | null | undefined): void {
    this.shouldReconnect = true
    this.tokenProvider = tokenProvider
    this._connect()
  }

  private _connect(): void {
    if (this.es && this.es.readyState !== EventSource.CLOSED) {
      return
    }

    if (!this.tokenProvider) {
      return
    }

    const token = this.tokenProvider()
    if (!token) {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this._connect(), this.reconnectDelay)
      }
      return
    }

    const url = `/api${this.path}?token=${encodeURIComponent(token)}`
    this.es = new EventSource(url)

    this.es.onopen = () => {
      this.reconnectDelay = 2000
    }

    this.es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as T
        this.onMessage(data)
      } catch {
        // ignore malformed
      }
    }

    this.es.onerror = () => {
      this.es?.close()
      this.es = null

      if (this.shouldReconnect) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000)
        this.reconnectTimer = setTimeout(() => this._connect(), this.reconnectDelay)
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.tokenProvider = null
    this.es?.close()
    this.es = null
  }
}
