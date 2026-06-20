import { useLocation, useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { User, LogOut, Users, BadgeCheck, Badge, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useRole } from '@/hooks/use-role'
import { useEffect } from 'react'
import { getTitleFromPathname } from '@/lib/route-titles'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const title = getTitleFromPathname(location.pathname)
  const { user, logout } = useAuth()
  const { isAdmin } = useRole()
  const displayName = user?.fullName || user?.username || 'Usuario'

  useEffect(() => {
    document.title = `${title} | Laboratorio`
  }, [title])

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 print:hidden">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 rounded-full px-3">
            <span className="mr-2 max-w-[180px] truncate text-sm font-medium">{displayName}</span>
            <User className="h-5 w-5" />
            <span className="sr-only">Menu de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <BadgeCheck className="h-3 w-3 text-primary" />
                    <span className="text-xs leading-none text-muted-foreground">Administrador</span>
                  </>
                ) : (
                  <>
                    <Badge className="h-3 w-3" />
                    <span className="text-xs leading-none text-muted-foreground">Usuario</span>
                  </>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard/account')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuracion de Cuenta</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => navigate('/dashboard/users')}>
                <Users className="mr-2 h-4 w-4" />
                <span>Gestion de Usuarios</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => { logout(); navigate('/login') }}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
