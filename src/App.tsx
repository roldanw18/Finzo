import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { Splash } from '@/components/Splash'
import { Toaster } from '@/components/ui/Toaster'
import { Login } from '@/pages/Login'
import { AlertTriangle, Loader2 } from 'lucide-react'

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })))
const Categories = lazy(() => import('@/pages/Categories').then((m) => ({ default: m.Categories })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function PageLoader() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  )
}

export default function App() {
  const status = useStore((s) => s.status)
  const error = useStore((s) => s.error)
  const init = useStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <>
      <AppContent status={status} error={error} retry={init} />
      <Toaster />
    </>
  )
}

function AppContent({
  status,
  error,
  retry,
}: {
  status: string
  error: string | null
  retry: () => void
}) {
  if (status === 'idle' || status === 'loading') return <Splash />

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-expense/10 text-expense">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-display text-xl font-bold">Algo salió mal</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button onClick={retry} className="btn-primary mt-5">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (status === 'auth') return <Login />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analisis" element={<Analytics />} />
          <Route path="/historial" element={<History />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
