import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SseClient } from '@/services/sse/_sse-client'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useVehiclesStore } from './vehicles-store'
import { httpClient } from '@/shared/api/http-client'
import type { VehiclePosition, VehicleWithPosition } from '@/shared/domain/vehicle'

type SseEvent =
  | { type: 'position'; data: VehiclePosition }
  | { type: 'vehicle_offline'; vehicleId: string }

export function useVehiclesSse() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { setVehicles, updatePosition, setVehicleOffline } = useVehiclesStore()
  const sseRef = useRef<SseClient<SseEvent> | null>(null)

  // Загрузить список машин при старте
  const { isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await httpClient.get<VehicleWithPosition[]>('/vehicles')
      setVehicles(data)
      return data
    },
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  })

  // SSE подписка на позиции
  useEffect(() => {
    if (!accessToken) return

    const sse = new SseClient<SseEvent>(
      '/api/tracking/stream',
      (event) => {
        if (event.type === 'position') updatePosition(event.data)
        else if (event.type === 'vehicle_offline') setVehicleOffline(event.vehicleId)
      },
    )

    sse.connect(accessToken)
    sseRef.current = sse

    return () => {
      sse.disconnect()
      sseRef.current = null
    }
  }, [accessToken, updatePosition, setVehicleOffline])

  return { isLoading }
}
