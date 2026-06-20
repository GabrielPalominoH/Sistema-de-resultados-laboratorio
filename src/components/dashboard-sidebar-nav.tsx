import { useLocation, useNavigate } from 'react-router-dom'
import { Apple, BarChart3, FileText, FlaskConical, Home, Search, TestTubeDiagonal, User as UserIcon } from 'lucide-react'
import { Logo } from '@/lib/logo'
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/dashboard/results', icon: FileText, label: 'Resultados' },
  { href: '/dashboard/metrics', icon: BarChart3, label: 'Métricas' },
]

const examItems = [
  { href: '/dashboard/exam/foods', icon: Apple, label: 'Análisis de Alimentos' },
  { href: '/dashboard/exam/hemograma-completo', icon: TestTubeDiagonal, label: 'Hemograma Completo' },
  { href: '/dashboard/exam/deteccion-sangre-oculta', icon: Search, label: 'Sangre Oculta en Heces' },
  { href: '/dashboard/exam/examen-general', icon: FlaskConical, label: 'Examen General' },
  { href: '/dashboard/exam/bioquimico', icon: FlaskConical, label: 'Bioquímico' },
  { href: '/dashboard/exam/nino', icon: UserIcon, label: 'Examen Niño' },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = isActivePath(location.pathname, href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Button
          variant="ghost"
          className={`w-full justify-start ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
          onClick={() => navigate(href)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function DashboardSidebarNav() {
  return (
    <SidebarContent className="flex h-full flex-col overflow-hidden">
      <SidebarHeader className="shrink-0">
        <Logo />
      </SidebarHeader>

      <div className="shrink-0">
        <SidebarMenu>
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </SidebarMenu>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs text-sidebar-foreground/70">Exámenes</p>
        <SidebarMenu className="pb-2">
          {examItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </SidebarMenu>
      </div>
    </SidebarContent>
  )
}
