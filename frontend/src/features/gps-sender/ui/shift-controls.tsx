import { useState } from 'react'
import { useGpsSender } from '../model/use-gps-sender'
import { useVehiclesStore } from '@/features/live-map/model/vehicles-store'
import type { VehicleWithPosition } from '@/shared/domain/vehicle'
import { cn } from '@/shared/lib/cn'

export function ShiftControls() {
  const { status, pendingCount, errorMessage, startShift, stopShift } = useGpsSender()
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const focusOnVehicle = useVehiclesStore((s) => s.focusOnVehicle)

  return (
    <div className="flex flex-col gap-2">
      {/* Кнопки управления */}
      {status === 'idle' || status === 'error' ? (
        <button
          onClick={startShift}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
            'bg-emerald-500 hover:bg-emerald-400 text-white',
            'shadow-lg shadow-emerald-500/25',
            'transition-all duration-200',
          )}
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          Начать смену
        </button>
      ) : (
        <button
          onClick={stopShift}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
            'bg-red-500/90 hover:bg-red-500 text-white',
            'shadow-lg shadow-red-500/20',
            'transition-all duration-200',
          )}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Завершить смену
        </button>
      )}

      {/* Селектор ТС */}
      <VehicleSelector vehicles={vehicles} onSelect={(v) => focusOnVehicle(v.id)} />

      {/* Ошибка */}
      {errorMessage && (
        <p className="text-xs text-red-400 max-w-[200px] leading-relaxed">{errorMessage}</p>
      )}

      {/* Офлайн очередь */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {pendingCount} точек в очереди
        </div>
      )}
    </div>
  )
}

// Компонент селектора, адаптированный для панели водителя
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
        // ИСПРАВЛЕНО: `bottom-full` заменено на `top-full`, чтобы список открывался вниз
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
