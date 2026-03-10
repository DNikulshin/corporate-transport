import { useEffect, useRef, useState, useCallback } from 'react'
import { useVehiclesSse } from '../model/use-vehicles-sse'
import { useVehiclesStore } from '../model/vehicles-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { env } from '@/shared/config/env'
import type { VehicleWithPosition } from '@/shared/domain/vehicle'

const MOSCOW_CENTER = [37.617698, 55.755864] as [number, number]

export function LiveMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<InstanceType<typeof window.ymaps3.YMap> | null>(null)
  const markersRef = useRef<Map<string, InstanceType<typeof window.ymaps3.YMapMarker>>>(new Map())
  const [mapsReady, setMapsReady] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const { isLoading } = useVehiclesSse()
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const currentUser = useAuthStore((s) => s.user)

  // Подписываемся на ID ТС для фокусировки и на функции для управления состоянием
  const vehicleIdToFocus = useVehiclesStore((s) => s.vehicleIdToFocus)
  const clearFocus = useVehiclesStore((s) => s.clearFocus)

  const handleClosePopup = useCallback(() => {
    setSelectedVehicleId(null)
  }, [])

  const handleFocusOnVehicle = useCallback((vehicle: VehicleWithPosition) => {
    if (vehicle.position && mapRef.current) {
      mapRef.current.setLocation({
        center: [vehicle.position.lng, vehicle.position.lat],
        zoom: 16,
        duration: 500,
      })
    }
  }, [])

  // Эффект для центрирования карты при выборе ТС из селектора
  useEffect(() => {
    if (vehicleIdToFocus) {
      const vehicle = vehicles.find((v) => v.id === vehicleIdToFocus)
      if (vehicle) {
        handleFocusOnVehicle(vehicle)
        // Опционально: можно также открывать попап для выбранного ТС
        // setSelectedVehicleId(vehicle.id)
      }
      // Очищаем состояние, чтобы избежать повторной фокусировки при перерисовках
      clearFocus()
    }
  }, [vehicleIdToFocus, vehicles, handleFocusOnVehicle, clearFocus])

  // Загрузка Яндекс Карт v3
  useEffect(() => {
    if (window.ymaps3) { setMapsReady(true); return }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${env.yandexMapsApiKey}&lang=ru_RU`
    script.async = true
    script.onload = async () => {
      await window.ymaps3.ready
      setMapsReady(true)
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  // Инициализация карты
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current) return

    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3

    const map = new YMap(mapContainerRef.current, {
      location: { center: MOSCOW_CENTER, zoom: 11 },
    })

    const schemeLayer = new YMapDefaultSchemeLayer({ theme: 'dark' } as any)
    const featuresLayer = new (YMapDefaultFeaturesLayer as any)()

    map.addChild(schemeLayer)
    map.addChild(featuresLayer)

    mapRef.current = map

    return () => {
      map.destroy()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [mapsReady])

  // Обновление маркеров (полное пересоздание)
  useEffect(() => {
    if (!mapRef.current || !mapsReady) return
    const { YMapMarker } = window.ymaps3
    const map = mapRef.current

    // Удаляем все старые маркеры
    for (const marker of markersRef.current.values()) {
      map.removeChild(marker)
    }
    markersRef.current.clear()

    // Создаем новые маркеры с актуальным состоянием
    for (const vehicle of vehicles) {
      if (!vehicle.position) continue

      const coords: [number, number] = [vehicle.position.lng, vehicle.position.lat]
      const isMyVehicle = currentUser?.vehicleId === vehicle.id
      const isActive = vehicle.isActive

      const el = createMarkerElement(vehicle, isMyVehicle, isActive, () =>
        setSelectedVehicleId(vehicle.id),
      )
      const marker = new YMapMarker({ coordinates: coords }, el)
      map.addChild(marker)
      markersRef.current.set(vehicle.id, marker)
    }
  }, [vehicles, mapsReady, currentUser])

  // Центрировать на своей машине при первом появлении
  useEffect(() => {
    if (!mapRef.current || !currentUser?.vehicleId) return
    const myVehicle = vehicles.find((v) => v.id === currentUser.vehicleId)
    if (myVehicle?.position) {
      mapRef.current.setLocation({
        center: [myVehicle.position.lng, myVehicle.position.lat],
        zoom: 14,
        duration: 600,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {(isLoading || !mapsReady) && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Загрузка карты...</span>
          </div>
        </div>
      )}

      {selectedVehicleId && (
        <VehiclePopup
          vehicleId={selectedVehicleId}
          onClose={handleClosePopup}
          onFocus={handleFocusOnVehicle}
        />
      )}

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            {vehicles.filter((v) => v.isActive).length} активных ТС
          </span>
        </div>
        <VehicleSelector
          vehicles={vehicles}
          onSelect={(vehicle) => {
            if (vehicle.position && mapRef.current) {
              mapRef.current.setLocation({
                center: [vehicle.position.lng, vehicle.position.lat],
                zoom: 16,
                duration: 500,
              })
            }
          }}
        />
      </div>
    </div>
  )
}

// НОВЫЙ КОМПОНЕНТ: Селектор для выбора ТС
interface VehicleSelectorProps {
  vehicles: VehicleWithPosition[]
  onSelect: (vehicle: VehicleWithPosition) => void
}

function VehicleSelector({ vehicles, onSelect }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (vehicle: VehicleWithPosition) => {
    onSelect(vehicle)
    setIsOpen(false)
  }

  const sortedVehicles = [...vehicles].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full min-w-[180px] gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
      >
        {/* ИСПРАВЛЕНО: Текст кнопки унифицирован */}
        <span>Найти ТС</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg z-30">
          <ul>
            {sortedVehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <button
                  onClick={() => handleSelect(vehicle)}
                  disabled={!vehicle.position}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-sky-500/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${vehicle.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`}
                  />
                  <span className="flex-1 truncate">
                    {vehicle.name} <span className="text-slate-500 font-mono">{vehicle.plateNumber}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function createMarkerElement(
  vehicle: VehicleWithPosition,
  isMyVehicle: boolean,
  isActive: boolean,
  onClick: () => void,
): HTMLElement {
  const el = document.createElement('div')
  el.className = 'cursor-pointer'

  el.innerHTML = `
    <div style="\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 4px;\n    ">
      <div style="\n        width: 36px;\n        height: 36px;\n        border-radius: 50%;\n        background: ${isMyVehicle ? '#0ea5e9' : isActive ? '#10b981' : '#64748b'};\n        border: 2.5px solid ${isMyVehicle ? '#38bdf8' : isActive ? '#34d399' : '#94a3b8'};\n        box-shadow: 0 0 ${isActive ? '12px' : '4px'} ${isMyVehicle ? '#0ea5e980' : isActive ? '#10b98150' : 'transparent'};\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        transition: all 0.3s ease;\n      ">
        <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
      <div style="\n        background: rgba(15,23,42,0.9);\n        border: 1px solid rgba(148,163,184,0.2);\n        border-radius: 6px;\n        padding: 2px 6px;\n        font-size: 10px;\n        font-weight: 600;\n        color: ${isMyVehicle ? '#38bdf8' : '#e2e8f0'};\n        white-space: nowrap;\n        backdrop-filter: blur(4px);\n      ">
        ${vehicle.plateNumber}
      </div>
    </div>
  `

  el.addEventListener('click', onClick)
  return el
}

interface VehiclePopupProps {
  vehicleId: string
  onClose: () => void
  onFocus: (vehicle: VehicleWithPosition) => void
}

function VehiclePopup({ vehicleId, onClose, onFocus }: VehiclePopupProps) {
  const vehicle = useVehiclesStore((s) => s.vehicles.find((v) => v.id === vehicleId))
  const currentUser = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!vehicle) {
      onClose()
    }
  }, [vehicle, onClose])

  if (!vehicle) {
    return null
  }

  const isMyVehicle = currentUser?.vehicleId === vehicle.id
  const speedKmh = vehicle.position?.speed
    ? Math.round(vehicle.position.speed * 3.6)
    : null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-72">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{vehicle.name}</span>
              {isMyVehicle && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-medium border border-sky-500/30">
                  Ваша
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">{vehicle.plateNumber}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat label="Статус" value={vehicle.isActive ? 'В рейсе' : 'Неактивен'} color={vehicle.isActive ? 'emerald' : 'slate'} />
          {speedKmh !== null && <Stat label="Скорость" value={`${speedKmh} км/ч`} />}
          {vehicle.driverName && <Stat label="Водитель" value={vehicle.driverName} />}
        </div>

        <button
          onClick={() => onFocus(vehicle)}
          className="w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-medium transition-colors"
        >
          Центрировать на карте
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, color = 'slate' }: { label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    slate: 'text-slate-300',
  }
  return (
    <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`text-xs font-semibold ${colorMap[color] ?? 'text-slate-300'}`}>{value}</div>
    </div>
  )
}
