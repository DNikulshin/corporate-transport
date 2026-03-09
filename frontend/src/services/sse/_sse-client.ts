import { env } from '@/shared/config/env'

export type SseMessageHandler<T = unknown> = (data: T) => void

export class SseClient<T = unknown> {
  private es: EventSource | null = null
  private onMessage: SseMessageHandler<T>
  private onError?: () => void
  private path: string

  constructor(
    path: string,
    onMessage: SseMessageHandler<T>,
    onError?: () => void,
  ) {
    this.path = path
    this.onMessage = onMessage
    this.onError = onError
  }

  connect(token: string): void {
    const url = `/api${this.path}?token=${encodeURIComponent(token)}`
    this.es = new EventSource(url)

    this.es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as T
        this.onMessage(data)
      } catch {
        // ignore
      }
    }

    this.es.onerror = () => {
      // EventSource переподключается автоматически
      this.onError?.()
    }
  }

  disconnect(): void {
    this.es?.close()
    this.es = null
  }

  get isConnected(): boolean {
    return this.es?.readyState === EventSource.OPEN
  }
}
