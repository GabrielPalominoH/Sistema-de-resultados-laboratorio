import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

export default function AccountSettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configuracion de Cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona una opcion para administrar tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Seguridad
          </CardTitle>
          <CardDescription>Opciones relacionadas al acceso y seguridad de la cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard/account/password')}>
            Cambiar contrasena
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
