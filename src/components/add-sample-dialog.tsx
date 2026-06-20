import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FlaskConical, Loader2 } from 'lucide-react';
import { saveSample } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import type { FormFieldDefinition } from '@/lib/definitions';

interface AddSampleDialogProps {
  labResultId: string;
  examType: string;
  currentSampleCount: number;
  onSampleAdded: () => void;
  formFields?: FormFieldDefinition[];
  canAdd?: boolean;
}

export function AddSampleDialog({
  labResultId,
  examType,
  currentSampleCount,
  onSampleAdded,
  formFields = [],
  canAdd = true,
}: AddSampleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().split('T')[0]);
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const nextSampleNumber = (currentSampleCount + 1) as 1 | 2 | 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data: Record<string, unknown> = {};
      
      if (formFields.length > 0) {
        formFields.forEach((field) => {
          if (sampleData[field.name]) {
            data[field.name] = field.type === 'number' 
              ? parseFloat(sampleData[field.name]) 
              : sampleData[field.name];
          }
        });
      }

      await saveSample(labResultId, nextSampleNumber, sampleDate, data, user.id);
      
      toast({
        title: 'Muestra agregada',
        description: `La muestra ${nextSampleNumber} ha sido agregada exitosamente`,
      });
      
      setOpen(false);
      setSampleData({});
      onSampleAdded();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la muestra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={canAdd ? setOpen : undefined}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={!canAdd}
          title={!canAdd ? 'No tienes permiso para agregar muestras' : ''}
        >
          <Plus className="h-4 w-4" />
          Agregar Muestra {nextSampleNumber}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Agregar Muestra {nextSampleNumber}
            </DialogTitle>
            <DialogDescription>
              Completa los datos para la muestra {nextSampleNumber} del examen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sampleDate">Fecha de Muestra</Label>
              <Input
                id="sampleDate"
                type="date"
                value={sampleDate}
                onChange={(e) => setSampleDate(e.target.value)}
                required
              />
            </div>

            {formFields.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-4">Datos de la Muestra</h4>
                  <div className="grid gap-4">
                    {formFields.map((field) => (
                      <div key={field.name} className="grid gap-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.name}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={sampleData[field.name] || ''}
                            onChange={(e) => setSampleData({
                              ...sampleData,
                              [field.name]: e.target.value,
                            })}
                          />
                        ) : field.type === 'select' && field.options ? (
                          <select
                            id={field.name}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-offset-2"
                            value={sampleData[field.name] || ''}
                            onChange={(e) => setSampleData({
                              ...sampleData,
                              [field.name]: e.target.value,
                            })}
                          >
                            <option value="">Seleccionar...</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={sampleData[field.name] || ''}
                            onChange={(e) => setSampleData({
                              ...sampleData,
                              [field.name]: e.target.value,
                            })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Muestra'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
