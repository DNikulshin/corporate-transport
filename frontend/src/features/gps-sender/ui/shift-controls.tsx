import { useGpsSender } from '../model/use-gps-sender'
import { cn } from '@/shared/lib/cn'

export function ShiftControls() {
  const { status, pendingCount, errorMessage, startShift, stopShift } = useGpsSender()

  return (
    <div className="flex flex-col gap-2">
      {/* Кнопка */}
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
