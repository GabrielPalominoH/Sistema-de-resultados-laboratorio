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
import { updatePatient } from '@/lib/db';
import type { PatientLookupResult } from '@/lib/definitions';

interface PatientEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientLookupResult;
  onPatientUpdated: (patient: PatientLookupResult) => void;
}

export function PatientEditModal({
  open,
  onOpenChange,
  patient,
  onPatientUpdated,
}: PatientEditModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await updatePatient(patient.dni || '', fullName, hcn || null, birthDate, phone || null, email || null);
      
      const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      onPatientUpdated({
        ...patient,
        fullName,
        hcn: hcn || undefined,
        age,
        phone: phone || undefined,
        birthDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar paciente');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
          <DialogDescription>
            Actualice los datos de <strong>{patient.fullName}</strong> (DNI: {patient.dni}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="dni" value={patient.dni} />

          <div className="space-y-1">
            <Label htmlFor="edit-fullName">Nombre completo *</Label>
            <Input
              id="edit-fullName"
              name="fullName"
              defaultValue={patient.fullName}
              placeholder="Apellidos y nombres"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-hcn">N° Historia Clínica (opcional)</Label>
            <Input
              id="edit-hcn"
              name="hcn"
              defaultValue={patient.hcn ?? ''}
              placeholder="Número de historia clínica"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-birthDate">Fecha de nacimiento *</Label>
            <Input
              id="edit-birthDate"
              name="birthDate"
              type="date"
              defaultValue={patient.birthDate ?? ''}
              max={maxDate}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-phone">Celular (opcional)</Label>
            <Input
              id="edit-phone"
              name="phone"
              defaultValue={patient.phone ?? ''}
              placeholder="Número de celular"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-email">Email (opcional)</Label>
            <Input
              id="edit-email"
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
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
