import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { saveResult, updateResult } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { examTypeSpanish } from '@/lib/exam-config';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { PatientLookupField } from './patient-lookup-field';
import type { FormFieldDefinition } from '@/lib/definitions';

interface SectionDef {
  title: string;
  fields: FormFieldDefinition[];
}

interface FormSchemaDef {
  title: string;
  description?: string;
  fields: FormFieldDefinition[];
  sections: SectionDef[];
}

interface ExamFormProps {
  formSchema: FormSchemaDef;
  examType: string;
  resultData?: Record<string, unknown>;
}

function buildZodSchema(formSchema: FormSchemaDef) {
  const shape: Record<string, z.ZodTypeAny> = {};

  const allFields = [
    ...formSchema.fields,
    ...formSchema.sections.flatMap(s => s.fields),
  ];

  for (const field of allFields) {
    if (field.required) {
      shape[field.name] = z.string().min(1, `${field.label} es requerido`);
    } else {
      shape[field.name] = z.string();
    }
  }

  return z.object(shape);
}

function FormFieldRenderer({
  field,
  control,
  setValue,
}: {
  field: FormFieldDefinition;
  control: ReturnType<typeof useForm>['control'];
  setValue: ReturnType<typeof useForm>['setValue'];
}) {
  if (field.name === 'patientId') {
    return (
      <FormField
        control={control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              <PatientLookupField
                value={formField.value || ''}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
                name={formField.name}
                placeholder={field.placeholder}
                disabled={formField.disabled}
                setValue={setValue as any}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <FormField
        control={control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={field.placeholder}
                {...formField}
                value={formField.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <FormField
        control={control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <Select
              onValueChange={formField.onChange}
              defaultValue={formField.value || ''}
              value={formField.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || `Seleccione ${field.label.toLowerCase()}`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {field.options.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={inputType}
                placeholder={field.placeholder}
                {...formField}
                value={formField.value || ''}
              />
              {field.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {field.suffix}
                </span>
              )}
            </div>
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ExamForm({ formSchema, examType, resultData }: ExamFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const isExamenGeneral = examType === 'examen-general';

  const allFields = useMemo(() => [
    ...formSchema.fields,
    ...formSchema.sections.flatMap(s => s.fields),
  ], [formSchema]);

  const zodSchema = useMemo(() => buildZodSchema(formSchema), [formSchema]);

  const defaultValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of allFields) {
      const existingVal = resultData?.[field.name];
      if (existingVal !== undefined && existingVal !== null && existingVal !== '') {
        values[field.name] = String(existingVal);
      } else {
        values[field.name] = '';
      }
    }
    return values;
  }, [allFields, resultData]);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { control, setValue, handleSubmit } = form;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const dataToSave: Record<string, unknown> = {
        examType: examTypeSpanish[examType] || examType,
        createdBy: user?.id || null,
      };

      for (const field of allFields) {
        const val = values[field.name];
        if (val === '' || val === undefined || val === null) {
          dataToSave[field.name] = null;
        } else if (field.type === 'number') {
          dataToSave[field.name] = Number(val);
        } else {
          dataToSave[field.name] = val;
        }
      }

      if (resultData?.id) {
        await updateResult({ ...dataToSave, id: resultData.id as string });
        toast({
          title: 'Actualizado',
          description: 'Registro actualizado exitosamente.',
        });
        navigate('/dashboard/results');
      } else {
        const saved = await saveResult(dataToSave);
        toast({
          title: 'Guardado',
          description: 'Registro guardado exitosamente.',
        });
        navigate(`/dashboard/results/${saved.id}`);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Ocurrió un error al guardar.',
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{formSchema.title}</CardTitle>
            {formSchema.description && (
              <p className="text-sm text-muted-foreground">{formSchema.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {formSchema.fields.map(field => (
              <FormFieldRenderer key={field.name} field={field} control={control} setValue={setValue} />
            ))}
          </CardContent>
        </Card>

        {formSchema.sections.map(section => {
          const isObservations = section.title === 'Observaciones';

          if (isExamenGeneral && !isObservations) {
            return (
              <Collapsible key={section.title} defaultOpen={false} className="group border rounded-lg">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 rounded-lg [data-state=open]:rounded-b-none">
                  {section.title}
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 space-y-4">
                  {section.fields.map(field => (
                    <FormFieldRenderer key={field.name} field={field} control={control} setValue={setValue} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <div key={section.title} className="space-y-4">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              {section.fields.map(field => (
                <FormFieldRenderer key={field.name} field={field} control={control} setValue={setValue} />
              ))}
            </div>
          );
        })}

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {resultData ? 'Actualizar Reporte' : 'Guardar Reporte'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
