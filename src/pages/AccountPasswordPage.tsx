import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updatePasswordWithCurrent } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { showPersistSuccessToast } from '@/lib/toast-messages';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AccountPasswordPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Las contrasenas no coinciden.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La contrasena debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La nueva contrasena debe ser diferente a la actual.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await updatePasswordWithCurrent(user!.id, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showPersistSuccessToast(toast);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar la contrasena',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Button variant="outline" onClick={() => navigate('/dashboard/account')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a configuracion
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contrasena</CardTitle>
          <CardDescription>Ingresa tu contrasena actual y define una nueva.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contrasena actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Ingresa tu contrasena actual"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contrasena</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contrasena"
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Actualizar contrasena'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
