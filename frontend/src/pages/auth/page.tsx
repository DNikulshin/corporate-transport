import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/features/auth'
import { useAuthStore } from '@/features/auth'
import { ROUTES } from '@/shared/config/routes'

export default function AuthPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())

  if (isAuthenticated) return <Navigate to={ROUTES.MAP} replace />

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
