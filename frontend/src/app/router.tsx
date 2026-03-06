import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@/shared/config/routes'
import { useAuthStore } from '@/features/auth'

const AuthPage = lazy(() => import('@/pages/auth/page'))
const MapPage = lazy(() => import('@/pages/map/page'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />
  return <>{children}</>
}

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export const router = createBrowserRouter([
  {
    path: ROUTES.AUTH,
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.MAP,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MapPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.MAP} replace />,
  },
])
