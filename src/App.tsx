import { useState, useEffect, useRef } from 'react'
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
import { getCurrentWindow } from '@tauri-apps/api/window'
import { hasUsers } from '@/lib/db'
import { Toaster } from '@/components/ui/toaster'
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
  const { user, logout } = useAuth()
  const [checkingFirstRun, setCheckingFirstRun] = useState(true)
  const [isFirstRun, setIsFirstRun] = useState(false)
  const firstRunChecked = useRef(false)

  useEffect(() => {
    // User is logged in → normal routes, no first-run
    if (user) {
      setIsFirstRun(false)
      setCheckingFirstRun(false)
      return
    }

    // Already checked earlier in this session → users exist, show login
    if (firstRunChecked.current) {
      setIsFirstRun(false)
      setCheckingFirstRun(false)
      return
    }

    // First time: check if any users exist in the database
    let cancelled = false
    hasUsers()
      .then((exists) => {
        if (!cancelled) {
          firstRunChecked.current = true
          setIsFirstRun(!exists)
          setCheckingFirstRun(false)
        }
      })
      .catch(() => {
        // On error, assume users exist and show login
        if (!cancelled) {
          firstRunChecked.current = true
          setIsFirstRun(false)
          setCheckingFirstRun(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  // Clear session when window is closed
  useEffect(() => {
    let unlisten: (() => void) | undefined
    getCurrentWindow().onCloseRequested(() => {
      logout()
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [logout])

  if (checkingFirstRun) {
    return <LoadingScreen />
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        {/* First-run: everything redirects to registration */}
        {isFirstRun ? (
          <>
            <Route path="*" element={<FirstRunPage />} />
          </>
        ) : (
          <>
            {/* Normal auth routes */}
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
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
          </>
        )}
      </Routes>
    </TooltipProvider>
  )
}
