import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function WagerLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first single column — the handoff phone frame, without the prototype bezel. */}
      <main className="pt-safe pb-safe mx-auto w-full max-w-[420px] px-5 pb-10 pt-3">
        <Outlet />
      </main>
    </div>
  )
}
