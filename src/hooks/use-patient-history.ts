import { useState, useCallback } from 'react';
import { getResults } from '@/lib/db';
import type { LabResult } from '@/lib/definitions';
import hemogramaCompleto from '@/lib/forms/hemograma-completo.json';
import examenGeneral from '@/lib/forms/examen-general.json';
import nino from '@/lib/forms/nino.json';
import bioquimico from '@/lib/forms/bioquimico.json';
import deteccionSangreOculta from '@/lib/forms/deteccion-sangre-oculta.json';
import foods from '@/lib/forms/foods.json';

interface FieldMeta {
  label: string;
  unit: string;
  refMin?: number;
  refMax?: number;
  category: string;
}

// Parses "V.N. 12.0 - 16.0 g/dL" → { refMin: 12.0, refMax: 16.0, unit: "g/dL" }
function parseReferenceRange(description: string): { refMin?: number; refMax?: number; unit: string } {
  const unitMatch = description.match(/([\w%\/³²⁶·uL]+)$/);
  const unit = unitMatch ? unitMatch[1] : '';

  const rangeMatch = description.match(/[\d.]+\s*-\s*[\d.]+/);
  if (rangeMatch) {
    const [low, high] = rangeMatch[0].split('-').map(s => parseFloat(s.trim()));
    if (!isNaN(low) && !isNaN(high)) {
      return { refMin: low, refMax: high, unit };
    }
  }

  return { unit };
}

interface FormFieldDef {
  name: string;
  label: string;
  type: string;
  description?: string;
  suffix?: string;
}

interface FormSection {
  title: string;
  fields: FormFieldDef[];
}

interface FormSchema {
  title: string;
  sections: FormSection[];
  fields?: FormFieldDef[];
}

const formSchemas: FormSchema[] = [
  hemogramaCompleto,
  examenGeneral,
  nino,
  bioquimico,
  deteccionSangreOculta,
  foods,
] as FormSchema[];

function buildFieldMeta(): Record<string, FieldMeta> {
  const meta: Record<string, FieldMeta> = {};

  for (const form of formSchemas) {
    for (const section of form.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (field.type !== 'number') continue;

        const desc = field.description ?? '';
        const { refMin, refMax, unit: parsedUnit } = parseReferenceRange(desc);
        const unit = field.suffix || parsedUnit;

        meta[field.name] = {
          label: field.label,
          unit,
          refMin,
          refMax,
          category: section.title,
        };
      }
    }
  }

  return meta;
}

export const FIELD_META = buildFieldMeta();

export interface AvailableField {
  key: string;
  label: string;
  unit: string;
  count: number;
  category: string;
}

export interface DataPoint {
  id: string;
  date: string;
  examType: string;
  values: Record<string, number>;
}

export interface PatientHistoryData {
  dataPoints: DataPoint[];
  availableFields: AvailableField[];
  totalExams: number;
  patientName: string;
}

export function usePatientHistory() {
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (dni: string, fullName: string) => {
    if (!dni) return;

    setLoading(true);
    setError(null);

    try {
      const allResults: LabResult[] = await getResults();
      const patientResults = allResults.filter(r => r.patientId === dni);

      if (patientResults.length === 0) {
        setData({
          dataPoints: [],
          availableFields: [],
          totalExams: 0,
          patientName: fullName,
        });
        return;
      }

      // Build data points, extracting numeric fields from each result's data
      const dataPoints: DataPoint[] = patientResults.map(r => {
        const values: Record<string, number> = {};
        if (r.data) {
          for (const [key, val] of Object.entries(r.data)) {
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            if (!isNaN(num)) {
              values[key] = num;
            }
          }
        }
        return {
          id: r.id,
          date: r.sampleDate || r.date,
          examType: r.examType,
          values,
        };
      });

      // Collect all numeric field keys that appear in patient data
      const fieldCounts = new Map<string, number>();
      for (const dp of dataPoints) {
        for (const key of Object.keys(dp.values)) {
          fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1);
        }
      }

      const availableFields: AvailableField[] = [];
      for (const [key, count] of fieldCounts) {
        const fm = FIELD_META[key];
        availableFields.push({
          key,
          label: fm?.label ?? key,
          unit: fm?.unit ?? '',
          count,
          category: fm?.category ?? 'Otros',
        });
      }

      availableFields.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.label.localeCompare(b.label);
      });

      setData({
        dataPoints,
        availableFields,
        totalExams: patientResults.length,
        patientName: fullName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener historial');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    fetchHistory,
    reset,
  } as const;
}
