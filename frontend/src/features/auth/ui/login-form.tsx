import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../_api'
import { useAuthStore } from '../model/auth-store'
import { ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'

export function LoginForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { mutate, isPending, error } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.accessToken, tokens.refreshToken)
      navigate(ROUTES.MAP, { replace: true })
    },
  })

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) return
    mutate({ username: username.trim(), password })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Ошибка входа' : null

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo / Brand */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-200 tracking-tight">КорпТранспорт</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Вход в систему</h1>
        <p className="text-sm text-slate-400">Введите учётные данные для доступа</p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Логин
          </label>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите логин"
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-slate-800/60 border border-slate-700/60',
              'text-white placeholder:text-slate-500',
              'focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20',
              'transition-all duration-200',
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите пароль"
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-xl text-sm',
                'bg-slate-800/60 border border-slate-700/60',
                'text-white placeholder:text-slate-500',
                'focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20',
                'transition-all duration-200',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !username.trim() || !password.trim()}
        className={cn(
          'w-full py-3 px-6 rounded-xl text-sm font-semibold',
          'bg-sky-500 hover:bg-sky-400 text-white',
          'shadow-lg shadow-sky-500/25',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
        )}
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Вход...
          </>
        ) : (
          'Войти'
        )}
      </button>
    </div>
  )
}
