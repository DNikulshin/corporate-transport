import { useEffect, useRef, useState, useCallback } from 'react'
import { WsClient } from '@/services/websocket/_ws-client'
import { geoService } from '@/services/geolocation/_geo-service'
import { offlineQueue } from './offline-queue'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { setVehicleOnline as apiSetVehicleOnline, setVehicleOffline as apiSetVehicleOffline } from '@/features/live-map/_api'
import { useVehiclesStore } from '@/features/live-map/model/vehicles-store'
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

const SHIFT_STATUS_KEY = 'shiftStatus'

export function useGpsSender(): UseGpsSenderResult {
  const user = useAuthStore((s) => s.user)
  
  // ИСПРАВЛЕНО: Запрашиваем каждую функцию отдельно. 
  // Это стандартный и правильный паттерн для Zustand, который предотвращает бесконечные циклы рендеринга.
  const setVehicleOnline = useVehiclesStore((s) => s.setVehicleOnline)
  const setVehicleOffline = useVehiclesStore((s) => s.setVehicleOffline)

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

    setStatus('active')
    setVehicleOnline(user.vehicleId)

    try {
      await apiSetVehicleOnline(user.vehicleId)
    } catch (err) {
      console.error('Failed to set vehicle online', err)
    }
  }, [user, setVehicleOnline])

  const stopShift = useCallback(async () => {
    if (!user?.vehicleId) return

    setStatus('idle')
    setVehicleOffline(user.vehicleId)
    setErrorMessage(null)

    try {
      await apiSetVehicleOffline(user.vehicleId)
    } catch (err) {
      console.error('Failed to set vehicle offline', err)
    }
  }, [user, setVehicleOffline])

  return { status, pendingCount, errorMessage, startShift, stopShift }
}
