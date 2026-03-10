import { useEffect, useRef, useState, useCallback } from 'react'
import { WsClient } from '@/services/websocket/_ws-client'
import { geoService } from '@/services/geolocation/_geo-service'
import { offlineQueue } from './offline-queue'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { setVehicleOnline as apiSetVehicleOnline, setVehicleOffline as apiSetVehicleOffline } from '@/features/live-map/_api'
import { useVehiclesStore } from '@/features/live-map/model/vehicles-store'
import { bearing } from '@/shared/lib/coords'
import { useWakeLock } from '@/shared/lib/useWakeLock' // <-- Импортируем наш новый хук
import type { GeoPosition } from '@/services/geolocation/_geo-service'

export type ShiftStatus = 'idle' | 'active' | 'error'

interface UseGpsSenderResult {
  status: ShiftStatus
  pendingCount: number
  errorMessage: string | null
  startShift: () => void
  stopShift: () => void
}

const SHIFT_STATUS_KEY = 'shiftStatus'

export function useGpsSender(): UseGpsSenderResult {
  const user = useAuthStore((s) => s.user)
  const setVehicleOnline = useVehiclesStore((s) => s.setVehicleOnline)
  const setVehicleOffline = useVehiclesStore((s) => s.setVehicleOffline)
  const wakeLock = useWakeLock() // <-- Инициализируем хук

  const wsRef = useRef<WsClient | null>(null)
  const lastPositionRef = useRef<GeoPosition | null>(null)

  const [status, setStatus] = useState<ShiftStatus>(
    () => (localStorage.getItem(SHIFT_STATUS_KEY) as ShiftStatus) || 'idle',
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(SHIFT_STATUS_KEY, status)
  }, [status])

  useEffect(() => {
    offlineQueue.count().then(setPendingCount)
  }, [])

  useEffect(() => {
    if (status !== 'active') {
      wsRef.current?.disconnect()
      wsRef.current = null
      return
    }

    if (!user?.vehicleId) {
      setStatus('error')
      setErrorMessage('Нет привязанного транспортного средства')
      return
    }

    setErrorMessage(null)

    const ws = new WsClient('/api/tracking/ws')
    wsRef.current = ws

    const flushQueue = async () => {
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
    }

    ws.on('open', flushQueue)

    ws.connect(() => useAuthStore.getState().accessToken)

    geoService.watch(
      async (pos) => {
        const heading = lastPositionRef.current ? bearing(lastPositionRef.current, pos) : pos.heading ?? 0
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

        if (!ws.send({ type: 'position', data: payload })) {
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

    return () => {
      geoService.stop()
      ws.disconnect()
      wsRef.current = null
      lastPositionRef.current = null
    }
  }, [status, user])

  const startShift = useCallback(async () => {
    if (!user?.vehicleId) return

    wakeLock.request() // <-- Запрашиваем блокировку экрана
    setStatus('active')
    setVehicleOnline(user.vehicleId)

    try {
      await apiSetVehicleOnline(user.vehicleId)
    } catch (err) {
      console.error('Failed to set vehicle online', err)
    }
  }, [user, setVehicleOnline, wakeLock])

  const stopShift = useCallback(async () => {
    if (!user?.vehicleId) return

    wakeLock.release() // <-- Освобождаем блокировку экрана
    setStatus('idle')
    setVehicleOffline(user.vehicleId)
    setErrorMessage(null)

    try {
      await apiSetVehicleOffline(user.vehicleId)
    } catch (err) {
      console.error('Failed to set vehicle offline', err)
    }
  }, [user, setVehicleOffline, wakeLock])

  return { status, pendingCount, errorMessage, startShift, stopShift }
}
