import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ExamForm } from '@/components/exam-form';
import bioquimicoForm from '@/lib/forms/bioquimico.json';
import deteccionSangreOcultaForm from '@/lib/forms/deteccion-sangre-oculta.json';
import examenGeneralForm from '@/lib/forms/examen-general.json';
import foodsForm from '@/lib/forms/foods.json';
import hemogramaCompletoForm from '@/lib/forms/hemograma-completo.json';
import ninoForm from '@/lib/forms/nino.json';
import { examTypeSpanish } from '@/lib/exam-config';

const formSchemas: Record<string, unknown> = {
  'hemograma-completo': hemogramaCompletoForm,
  'foods': foodsForm,
  'deteccion-sangre-oculta': deteccionSangreOcultaForm,
  'examen-general': examenGeneralForm,
  'bioquimico': bioquimicoForm,
  'nino': ninoForm,
};

export default function NewExamPage() {
  const { slug } = useParams<{ slug: string }>();

  const formSchema = slug ? formSchemas[slug] as any : null;

  const pageTitle = useMemo(() => {
    if (!slug) return 'Nuevo Examen';
    const spanish = examTypeSpanish[slug];
    return spanish ? `Nuevo: ${spanish}` : 'Nuevo Examen';
  }, [slug]);

  if (!slug || !formSchema) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-semibold">Examen no encontrado</h2>
        <p className="text-muted-foreground">El tipo de examen solicitado no existe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">Complete los campos del formulario para generar un nuevo reporte.</p>
      </div>
      <ExamForm formSchema={formSchema} examType={slug} />
    </div>
  );
}
