import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/header'
import { DashboardSidebarNav } from '@/components/dashboard-sidebar-nav'
import LoginPage from '@/pages/LoginPage'
import FirstRunPage from '@/pages/FirstRunPage'
import DashboardPage from '@/pages/DashboardPage'
import NewExamPage from '@/pages/NewExamPage'
import EditExamPage from '@/pages/EditExamPage'
import ResultsListPage from '@/pages/ResultsListPage'
import ResultDetailPage from '@/pages/ResultDetailPage'
import MetricsPage from '@/pages/MetricsPage'
import UsersPage from '@/pages/UsersPage'
import AccountPage from '@/pages/AccountPage'
import AccountPasswordPage from '@/pages/AccountPasswordPage'
import { useAuth } from '@/lib/auth'
import { hasUsers } from '@/lib/db'
import { Loader2 } from 'lucide-react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <DashboardSidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="bg-background p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  const [checkingFirstRun, setCheckingFirstRun] = useState(true)
  const [isFirstRun, setIsFirstRun] = useState(false)

  useEffect(() => {
    if (user) {
      setCheckingFirstRun(false)
      return
    }

    let cancelled = false
    hasUsers()
      .then((exists) => {
        if (!cancelled) {
          setIsFirstRun(!exists)
          setCheckingFirstRun(false)
        }
      })
      .catch(() => {
        // If the check fails, assume there are users (show normal login)
        if (!cancelled) {
          setIsFirstRun(false)
          setCheckingFirstRun(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  if (checkingFirstRun) {
    return <LoadingScreen />
  }

  return (
    <TooltipProvider>
      <Routes>
        {/* First-run registration (no users in DB) */}
        {isFirstRun && (
          <Route path="*" element={<FirstRunPage />} />
        )}

        {/* Normal auth routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/first-run"
          element={isFirstRun ? <FirstRunPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/results"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ResultsListPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/results/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ResultDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/exam/:slug"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <NewExamPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/exam/:slug/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditExamPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/metrics"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MetricsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/account"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AccountPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/account/password"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AccountPasswordPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
