import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/use-role';
import { AdminOnly } from '@/components/role-gate';
import { getResultById, getSamplesByResultId, deleteSample, getAllUsers } from '@/lib/db';
import { getExamTypeSlug, hasMultipleSamples } from '@/lib/exam-config';
import type { LabResult, ExamSample, FormFieldDefinition, UserProfile } from '@/lib/definitions';
import bioquimicoForm from '@/lib/forms/bioquimico.json';
import deteccionSangreOcultaForm from '@/lib/forms/deteccion-sangre-oculta.json';
import examenGeneralForm from '@/lib/forms/examen-general.json';
import foodsForm from '@/lib/forms/foods.json';
import hemogramaCompletoForm from '@/lib/forms/hemograma-completo.json';
import ninoForm from '@/lib/forms/nino.json';
import { ReportHeader } from '@/components/report-header';
import { ReportPatientInfo } from '@/components/report-patient-info';
import { ReportResults } from '@/components/report-results';
import { ReportFooter } from '@/components/report-footer';
import { PrintButton } from '@/components/print-button';
import { fieldLabels, suffixes } from '@/lib/field-labels';

type FormSchema = {
  fields: FormFieldDefinition[];
  sections?: {
    fields: FormFieldDefinition[];
  }[];
};

const excludedFields = ['id', 'examType', 'patientName', 'patientId', 'date', 'sampleDate', 'patientAge', 'hcn', 'data', 'observaciones', 'observations', 'parasitologyDirectExam', 'createdAt', 'updatedAt', 'createdBy', 'phone'];

const formSchemaBySlug: Record<string, FormSchema> = {
  bioquimico: bioquimicoForm as FormSchema,
  'deteccion-sangre-oculta': deteccionSangreOcultaForm as FormSchema,
  'examen-general': examenGeneralForm as FormSchema,
  foods: foodsForm as FormSchema,
  'hemograma-completo': hemogramaCompletoForm as FormSchema,
  nino: ninoForm as FormSchema,
};

const patientAndMetaFields = new Set(['patientName', 'patientId', 'patientAge', 'hcn', 'sampleDate', 'date', 'examType']);

function getExamFieldOrder(examType: string): string[] {
  const slug = getExamTypeSlug(examType);
  const schema = formSchemaBySlug[slug];
  if (!schema) return [];

  const orderedFields = [
    ...schema.fields.map((field) => field.name),
    ...(schema.sections?.flatMap((section) => section.fields.map((field) => field.name)) || []),
  ];

  return orderedFields.filter((fieldName) => !patientAndMetaFields.has(fieldName));
}

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, canEditExam } = useRole();
  const [result, setResult] = useState<LabResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [samples, setSamples] = useState<ExamSample[]>([]);
  const [expandedSamples, setExpandedSamples] = useState<Set<string>>(new Set());
  const [performerName, setPerformerName] = useState<string>("");

  const canEditThisResult = result ? (isAdmin || canEditExam(result.examType)) : false;
  const slug = result ? getExamTypeSlug(result.examType) : null;
  const showSamplesSection = !!result && hasMultipleSamples(result.examType);

  useEffect(() => {
    if (!id) return;
    getResultById(id).then((found) => {
      setResult(found || null);
      setIsLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (result && showSamplesSection) {
      loadSamples();
    }
  }, [result, showSamplesSection]);

  useEffect(() => {
    if (!result?.createdBy) return;
    getAllUsers().then((users) => {
      const user = users.find((u) => u.id === result.createdBy);
      if (user) {
        setPerformerName(user.fullName || user.username);
      }
    }).catch(() => {});
  }, [result?.createdBy]);

  const loadSamples = async () => {
    if (!result) return;
    try {
      const data = await getSamplesByResultId(result.id);
      setSamples(data);
    } catch {
    }
  };

  const toggleSample = (sampleId: string) => {
    const newExpanded = new Set(expandedSamples);
    if (newExpanded.has(sampleId)) {
      newExpanded.delete(sampleId);
    } else {
      newExpanded.add(sampleId);
    }
    setExpandedSamples(newExpanded);
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta muestra?')) return;

    try {
      await deleteSample(sampleId);
      setSamples(samples.filter(s => s.id !== sampleId));
      toast({
        title: 'Muestra eliminada',
        description: 'La muestra ha sido eliminada exitosamente',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la muestra',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Resultado no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/results')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Resultados
        </Button>
      </div>
    );
  }

  const populatedResultFields = Object.keys(result).filter((key) =>
    !excludedFields.includes(key) && result[key] && result[key] !== '' && typeof result[key] !== 'object'
  );
  const formOrderedFields = getExamFieldOrder(result.examType);
  const populatedFieldSet = new Set(populatedResultFields);
  const formOrderedVisibleFields = formOrderedFields.filter((fieldName) => populatedFieldSet.has(fieldName));
  const remainingFields = populatedResultFields.filter((fieldName) => !formOrderedVisibleFields.includes(fieldName));
  const resultFields = [...formOrderedVisibleFields, ...remainingFields];

  const examTypeSpanish: Record<string, string> = {
    'Análisis de Alimentos': 'Análisis de Alimentos',
    'Hemograma Completo': 'Hemograma Completo',
    'Detección Cualitativa de Sangre Oculta en Heces': 'Detección Cualitativa de Sangre Oculta en Heces',
    'Examen General': 'Examen General',
    'Bioquímico': 'Bioquímico',
    'Examen Niño': 'Examen Niño',
  };

  const formatSampleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => navigate('/dashboard/results')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Resultados
        </Button>
        <div className="flex gap-2">
          {canEditThisResult && slug && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/exam/${slug}/${result.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          <PrintButton />
        </div>
      </div>

      {showSamplesSection && samples.length > 0 && (
        <div className="space-y-2">
          {samples.map((sample) => (
            <div key={sample.id} className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSample(sample.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Muestra {sample.sample_number}</span>
                  <span className="text-sm text-muted-foreground">
                    ({formatSampleDate(sample.sample_date)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AdminOnly>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSample(sample.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AdminOnly>
                  {expandedSamples.has(sample.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              {expandedSamples.has(sample.id) && (
                <div className="px-3 pb-3 border-t pt-3">
                  {Object.keys(sample.sample_data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(sample.sample_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {fieldLabels[key] || key}:
                          </span>
                          <span className="font-medium">{String(value ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos específicos</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Separator className="print:hidden" />

      <div id="printable-area" className="bg-slate-50 print:bg-white print:w-full print:max-w-none -my-6">
        <div className="w-full max-w-3xl mx-auto p-6 bg-white print:bg-white print:p-4 print:shadow-none rounded-lg print:rounded-none">
          <div className="space-y-5 print:space-y-3">
            <ReportHeader
              examType={examTypeSpanish[result.examType] || result.examType}
            />

            <ReportPatientInfo
              patient={{
                patientName: result.patientName,
                patientId: result.patientId,
                hcn: result.hcn,
                patientAge: result.patientAge,
                date: result.date,
                sampleDate: result.sampleDate,
              }}
            />

            <ReportResults
              results={resultFields.map(key => ({
                key,
                label: fieldLabels[key] || key,
                value: String(result[key as keyof LabResult] ?? ''),
                suffix: suffixes[key],
              }))}
              observations={result.observaciones || result.observations || result.parasitologyDirectExam ? String(result.observaciones || result.observations || result.parasitologyDirectExam || '') : undefined}
            />

            <ReportFooter
              generatedAt={result.createdAt}
              performedBy={performerName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
