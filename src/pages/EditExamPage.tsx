import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExamForm } from '@/components/exam-form';
import { getResultById } from '@/lib/db';
import { examTypeSpanish } from '@/lib/exam-config';
import bioquimicoForm from '@/lib/forms/bioquimico.json';
import deteccionSangreOcultaForm from '@/lib/forms/deteccion-sangre-oculta.json';
import examenGeneralForm from '@/lib/forms/examen-general.json';
import foodsForm from '@/lib/forms/foods.json';
import hemogramaCompletoForm from '@/lib/forms/hemograma-completo.json';
import ninoForm from '@/lib/forms/nino.json';
import { Loader2 } from 'lucide-react';
import type { LabResult } from '@/lib/definitions';

const formSchemas: Record<string, unknown> = {
  'hemograma-completo': hemogramaCompletoForm,
  'foods': foodsForm,
  'deteccion-sangre-oculta': deteccionSangreOcultaForm,
  'examen-general': examenGeneralForm,
  'bioquimico': bioquimicoForm,
  'nino': ninoForm,
};

export default function EditExamPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [result, setResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formSchema = slug ? formSchemas[slug] as any : null;

  useEffect(() => {
    if (!id) {
      setError('ID de resultado no proporcionado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getResultById(id)
      .then((data) => {
        if (!data) {
          setError('Resultado no encontrado.');
          return;
        }
        setResult(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el resultado.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const pageTitle = useMemo(() => {
    if (!slug) return 'Editar Examen';
    if (!result) {
      const spanish = examTypeSpanish[slug];
      return spanish ? `Editar: ${spanish}` : 'Editar Examen';
    }
    const examName = examTypeSpanish[slug] || result.examType;
    const patient = result.patientName || result.patientId || '';
    return `Editar: ${examName}${patient ? ` - ${patient}` : ''}`;
  }, [slug, result]);

  if (!slug || !formSchema) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-semibold">Examen no encontrado</h2>
        <p className="text-muted-foreground">El tipo de examen solicitado no existe.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando resultado...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-muted-foreground">{error || 'No se pudo cargar el resultado.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">Modifique los campos del formulario y guarde los cambios.</p>
      </div>
      <ExamForm
        formSchema={formSchema}
        examType={slug}
        resultData={result as unknown as Record<string, unknown>}
      />
    </div>
  );
}
