import { useEffect, useRef, useState, useCallback } from 'react'
import { WsClient } from '@/services/websocket/_ws-client'
import { geoService } from '@/services/geolocation/_geo-service'
import { offlineQueue } from './offline-queue'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { bearing } from '@/shared/lib/coords'
import type { GeoPosition } from '@/services/geolocation/_geo-service'

export type ShiftStatus = 'idle' | 'active' | 'error'

interface UseGpsSenderResult {
  status: ShiftStatus
  pendingCount: number
  errorMessage: string | null
  startShift: () => void
  stopShift: () => void
}

export function useGpsSender(): UseGpsSenderResult {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const wsRef = useRef<WsClient | null>(null)
  const lastPositionRef = useRef<GeoPosition | null>(null)

  const [status, setStatus] = useState<ShiftStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Flush очереди при подключении WS
  const flushQueue = useCallback(async (ws: WsClient) => {
    const pending = await offlineQueue.getPending()
    if (pending.length === 0) return

    const sent: number[] = []
    for (const pos of pending) {
      const ok = ws.send({ type: 'position', data: pos })
      if (ok) sent.push(pos.timestamp)
      else break
    }

    if (sent.length > 0) {
      await offlineQueue.markSynced(sent)
      await offlineQueue.clearSynced()
      setPendingCount(await offlineQueue.count())
    }
  }, [])

  const startShift = useCallback(() => {
    if (!user?.vehicleId || !accessToken) {
      setErrorMessage('Нет привязанного транспортного средства')
      return
    }

    setStatus('active')
    setErrorMessage(null)

    const ws = new WsClient('/ws/tracking')
    wsRef.current = ws

    ws.on('open', () => flushQueue(ws))

    ws.connect(accessToken)

    geoService.watch(
      async (pos) => {
        const heading = lastPositionRef.current
          ? bearing(lastPositionRef.current, pos)
          : pos.heading ?? 0
        lastPositionRef.current = pos

        const payload = {
          vehicleId: user.vehicleId!,
          lat: pos.lat,
          lng: pos.lng,
          heading,
          speed: pos.speed ? Math.round(pos.speed * 3.6) : 0,
          accuracy: pos.accuracy,
          timestamp: pos.timestamp,
        }

        const sent = ws.send({ type: 'position', data: payload })
        if (!sent) {
          // WS недоступен — сохранить в очередь
          await offlineQueue.enqueue(payload)
          setPendingCount(await offlineQueue.count())
        }
      },
      (err) => {
        setStatus('error')
        setErrorMessage(
          err.code === 1
            ? 'Геолокация запрещена. Разрешите доступ в настройках браузера.'
            : 'Ошибка определения местоположения',
        )
      },
    )
  }, [user, accessToken, flushQueue])

  const stopShift = useCallback(() => {
    geoService.stop()
    wsRef.current?.disconnect()
    wsRef.current = null
    lastPositionRef.current = null
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      geoService.stop()
      wsRef.current?.disconnect()
    }
  }, [])

  return { status, pendingCount, errorMessage, startShift, stopShift }
}
