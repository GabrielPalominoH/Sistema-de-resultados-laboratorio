import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerPatient } from '@/lib/db';
import type { PatientLookupResult } from '@/lib/definitions';
import { useAuth } from '@/lib/auth';

interface PatientRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dni: string;
  onPatientRegistered: (patient: PatientLookupResult) => void;
}

export function PatientRegisterModal({
  open,
  onOpenChange,
  dni,
  onPatientRegistered,
}: PatientRegisterModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const maxDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const hcn = formData.get('hcn') as string;
    const birthDate = formData.get('birthDate') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    try {
      await registerPatient(dni, fullName, hcn || null, birthDate, phone || null, email || null, user?.id || null);
      
      const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      onPatientRegistered({
        dni,
        fullName,
        hcn: hcn || undefined,
        age,
        phone: phone || undefined,
        birthDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar paciente');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
          <DialogDescription>
            No se encontró paciente con DNI <strong>{dni}</strong>. Complete los datos para registrarlo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="dni" value={dni} />

          <div className="space-y-1">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Apellidos y nombres"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="hcn">N° Historia Clínica (opcional)</Label>
            <Input
              id="hcn"
              name="hcn"
              placeholder="Número de historia clínica"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              max={maxDate}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Celular (opcional)</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Número de celular"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Paciente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
