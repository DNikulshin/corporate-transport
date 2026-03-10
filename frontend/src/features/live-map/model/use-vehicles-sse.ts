import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SseClient } from '@/services/sse/_sse-client'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useVehiclesStore } from './vehicles-store'
import { httpClient } from '@/shared/api/http-client'
import type { VehiclePosition, VehicleWithPosition } from '@/shared/domain/vehicle'

type SseEvent =
  | { type: 'position'; data: VehiclePosition }
  | { type: 'vehicle_online'; vehicleId: string }
  | { type: 'vehicle_offline'; vehicleId: string }

export function useVehiclesSse() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // FIX: Используем `getState` для получения стабильных ссылок на функции-действия.
  // Это предотвращает бесконечные циклы, вызванные пересозданием хука `useEffect`.
  const { setVehicles, updatePosition, setVehicleOnline, setVehicleOffline } = useVehiclesStore.getState()

  const { isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await httpClient.get<VehicleWithPosition[]>('/vehicles')
      setVehicles(data)
      return data
    },
    enabled: Boolean(accessToken),

    // FIX: Отключаем агрессивное фоновое обновление `react-query`.
    // Это предотвращает "гонку состояний", когда данные с сервера затирали
    // оптимистичное обновление статуса на клиенте. Теперь SSE - единственный источник правды.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (!accessToken) return

    const sse = new SseClient<SseEvent>('/tracking/stream', (event) => {
      if (event.type === 'position') {
        updatePosition(event.data)
      } else if (event.type === 'vehicle_online') {
        setVehicleOnline(event.vehicleId)
      } else if (event.type === 'vehicle_offline') {
        setVehicleOffline(event.vehicleId)
      }
    })

    sse.connect(() => useAuthStore.getState().accessToken)

    return () => {
      sse.disconnect()
    }
  }, [accessToken, setVehicles, updatePosition, setVehicleOnline, setVehicleOffline])

  return { isLoading }
}
