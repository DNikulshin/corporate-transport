import { useNavigate } from 'react-router-dom'
import { LiveMap } from '@/features/live-map'
import { ShiftControls } from '@/features/gps-sender'
import { useAuthStore } from '@/features/auth'
import { authApi } from '@/features/auth'
import { ROUTES } from '@/shared/config/routes'
import { useState } from 'react'

export default function MapPage() {
  const navigate = useNavigate()
  const { user, clearAuth, isDriver } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate(ROUTES.AUTH, { replace: true })
  }

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden">
      {/* Карта занимает весь экран */}
      <LiveMap />

      {/* Верхняя панель */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pointer-events-none">
        {/* Кнопки для водителя */}
        <div className="pointer-events-auto">
          {isDriver() && <ShiftControls />}
        </div>

        {/* Профиль */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
              {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:block max-w-[120px] truncate">{user?.fullName}</span>
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10">
                <div className="px-4 py-3 border-b border-slate-800">
                  <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.role === 'driver' ? 'Водитель' : 'Сотрудник'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  )
}
