import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, FlaskConical } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const authUser = await login(username, password)
      if (authUser.mustChangePassword) {
        navigate('/dashboard/account/password')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary p-3 shadow-lg shadow-primary/20">
          <FlaskConical className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Laboratorio</h1>
          <p className="text-sm text-muted-foreground">Posta José Paseta Bar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Inicio de Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="usuario"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            <p className="pt-2 text-center text-sm text-muted-foreground border-t">
              Contacta al administrador para crear tu cuenta
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
