import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/header'
import { DashboardSidebarNav } from '@/components/dashboard-sidebar-nav'
import LoginPage from '@/pages/LoginPage'
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

export default function App() {
  const { user } = useAuth()

  return (
    <TooltipProvider>
      <Routes>
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
      </Routes>
    </TooltipProvider>
  )
}
