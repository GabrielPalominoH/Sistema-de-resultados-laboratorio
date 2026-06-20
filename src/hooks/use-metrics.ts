import { useState, useCallback, useEffect } from 'react';
import { getResults, getAllUsers } from '@/lib/db';
import type { LabResult } from '@/lib/definitions';
import hemogramaCompleto from '@/lib/forms/hemograma-completo.json';
import examenGeneral from '@/lib/forms/examen-general.json';
import nino from '@/lib/forms/nino.json';
import bioquimico from '@/lib/forms/bioquimico.json';
import deteccionSangreOculta from '@/lib/forms/deteccion-sangre-oculta.json';
import foods from '@/lib/forms/foods.json';

export interface IndicatorOption {
  key: string;
  label: string;
  count: number;
  type: 'numeric' | 'categorical';
  unit?: string;
  normalRange?: { low: number; high: number };
}

export interface NumericIndicatorData {
  min: number;
  max: number;
  average: number;
  totalWithValue: number;
  lowCount: number;
  normalCount: number;
  highCount: number;
}

export interface CategoricalIndicatorData {
  positive: number;
  negative: number;
  other: number;
  total: number;
}

export interface ExamMetrics {
  totalExams: number;
  examsByType: Record<string, number>;
  examsByDay: Record<string, number>;
  examsByMonth: Record<string, number>;
  examsByYear: Record<string, number>;
  examsByUser: { userId: string; userEmail: string; count: number }[];
  indicatorOptions: IndicatorOption[];
  numericIndicators: Record<string, NumericIndicatorData>;
  categoricalIndicators: Record<string, CategoricalIndicatorData>;
}

export interface DateRange {
  from: string;
  to?: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  examType?: string;
  userId?: string;
}

const positiveValues = new Set(['positivo', 'reactivo', 'reactiva', '+', 'detected', 'detectado']);
const negativeValues = new Set([
  'negativo',
  'no reactivo',
  'no-reactivo',
  'no reactiva',
  'no-reactiva',
  '-',
  'not detected',
  'no detectable',
  'no detectado',
]);

function normalizeString(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function classifyCategoricalValue(rawValue: unknown): 'positive' | 'negative' | 'other' | 'empty' {
  if (rawValue === null || rawValue === undefined) return 'empty';
  const normalized = normalizeString(String(rawValue));
  if (!normalized) return 'empty';
  if (positiveValues.has(normalized)) return 'positive';
  if (negativeValues.has(normalized)) return 'negative';
  return 'other';
}

function parseNormalRange(description: string): { low: number; high: number } | null {
  if (!description) return null;
  const match = description.match(/V\.N\.\s*([\d.]+)\s*[-\u2013]\s*([\d.]+)/i);
  if (!match) return null;
  const low = parseFloat(match[1]);
  const high = parseFloat(match[2]);
  if (isFinite(low) && isFinite(high)) {
    return { low, high };
  }
  return null;
}

const formDefinitions = [hemogramaCompleto, examenGeneral, nino, bioquimico, deteccionSangreOculta, foods];

const excludedFields = new Set([
  'observaciones',
  'patientName',
  'patientId',
  'hcn',
  'phone',
  'sampleDate',
]);

function buildFieldMetadata(): Record<string, { label: string; type: string; unit?: string; normalRange?: { low: number; high: number } }> {
  const metadata: Record<string, { label: string; type: string; unit?: string; normalRange?: { low: number; high: number } }> = {};

  for (const form of formDefinitions) {
    const processFields = (fields: any[]) => {
      for (const field of fields) {
        if (field.name && !metadata[field.name] && !excludedFields.has(field.name) && field.type !== 'textarea') {
          const normalRange = field.description ? parseNormalRange(field.description) : undefined;
          metadata[field.name] = {
            label: field.label || field.name,
            type: field.type || 'text',
            unit: field.suffix || field.unit,
            normalRange: normalRange ?? undefined,
          };
        }
      }
    };

    if (form.fields) processFields(form.fields);
    if (form.sections) {
      for (const section of form.sections) {
        if (section.fields) processFields(section.fields);
      }
    }
  }

  return metadata;
}

const fieldMetadata = buildFieldMetadata();

const knownCategoricalFields = new Set([
  'hivTest', 'syphilisTest', 'rprVrdl', 'fobTest', 'resultado', 'pregnancyTest', 'rhFactor',
  'bloodGroup', 'grupo_sanguineo', 'factor_rh',
]);

export function useMetrics() {
  const [metrics, setMetrics] = useState<ExamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (filters?: FilterOptions) => {
    setLoading(true);
    setError(null);

    try {
      const allResults: LabResult[] = await getResults();

      let rows = allResults;

      if (filters?.examType) {
        rows = rows.filter(r => r.examType === filters.examType);
      }
      if (filters?.dateRange?.from) {
        rows = rows.filter(r => {
          const d = r.date || r.createdAt?.split(' ')[0] || '';
          return d >= filters.dateRange!.from;
        });
      }
      if (filters?.dateRange?.to) {
        rows = rows.filter(r => {
          const d = r.date || r.createdAt?.split(' ')[0] || '';
          return d <= filters.dateRange!.to;
        });
      }
      if (filters?.userId) {
        rows = rows.filter(r => r.createdBy === filters.userId);
      }

      const examsByType: Record<string, number> = {};
      const examsByDay: Record<string, number> = {};
      const examsByMonth: Record<string, number> = {};
      const examsByYear: Record<string, number> = {};
      const userCounts: Record<string, { email: string; count: number }> = {};

      const numericValues: Record<string, number[]> = {};
      const categoricalValues: Record<string, { positive: number; negative: number; other: number; total: number }> = {};

      for (const exam of rows) {
        const examType = exam.examType || 'Unknown';
        examsByType[examType] = (examsByType[examType] || 0) + 1;

        const dateStr = exam.date || (exam.createdAt ? exam.createdAt.split(' ')[0] : '');
        if (dateStr) {
          examsByDay[dateStr] = (examsByDay[dateStr] || 0) + 1;
          const month = dateStr.slice(0, 7);
          const year = dateStr.slice(0, 4);
          examsByMonth[month] = (examsByMonth[month] || 0) + 1;
          examsByYear[year] = (examsByYear[year] || 0) + 1;
        }

        if (exam.createdBy) {
          if (!userCounts[exam.createdBy]) {
            userCounts[exam.createdBy] = { email: 'Usuario', count: 0 };
          }
          userCounts[exam.createdBy].count++;
        }

        const rowData = (exam.data && typeof exam.data === 'object' ? exam.data : {}) as Record<string, unknown>;

        const allFields = new Set<string>();
        if (exam.resultado !== null && exam.resultado !== undefined) {
          allFields.add('resultado');
        }
        if (rowData) {
          Object.keys(rowData).forEach(key => allFields.add(key));
        }

        for (const key of allFields) {
          const rawValue = key === 'resultado' ? exam.resultado : rowData[key];
          if (rawValue === null || rawValue === undefined || rawValue === '') continue;

          const meta = fieldMetadata[key];
          const fieldType = meta?.type || 'text';

          if (fieldType === 'number') {
            const numValue = Number(rawValue);
            if (Number.isFinite(numValue)) {
              if (!numericValues[key]) numericValues[key] = [];
              numericValues[key].push(numValue);
            }
          } else {
            if (!categoricalValues[key]) {
              categoricalValues[key] = { positive: 0, negative: 0, other: 0, total: 0 };
            }
            categoricalValues[key].total++;
            const classification = classifyCategoricalValue(rawValue);
            if (classification === 'positive') categoricalValues[key].positive++;
            else if (classification === 'negative') categoricalValues[key].negative++;
            else if (classification === 'other') categoricalValues[key].other++;
          }
        }
      }

      const userIds = Object.keys(userCounts);
      if (userIds.length > 0) {
        const users = await getAllUsers();
        const userMap = new Map(users.map(u => [u.id, u]));
        for (const id of userIds) {
          const profile = userMap.get(id);
          if (profile) {
            userCounts[id].email = profile.fullName || profile.username || 'Usuario';
          }
        }
      }

      const examsByUser = Object.entries(userCounts)
        .map(([userId, userData]) => ({
          userId,
          userEmail: userData.email,
          count: userData.count,
        }))
        .sort((a, b) => b.count - a.count);

      const numericIndicators: Record<string, NumericIndicatorData> = {};
      const indicatorOptions: IndicatorOption[] = [];

      for (const [key, values] of Object.entries(numericValues)) {
        if (values.length === 0) continue;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        const meta = fieldMetadata[key];
        let lowCount = 0, normalCount = 0, highCount = 0;
        const normalRange = meta?.normalRange;
        if (normalRange) {
          lowCount = values.filter(v => v < normalRange.low).length;
          normalCount = values.filter(v => v >= normalRange.low && v <= normalRange.high).length;
          highCount = values.filter(v => v > normalRange.high).length;
        }
        numericIndicators[key] = {
          min,
          max,
          average,
          totalWithValue: values.length,
          lowCount,
          normalCount,
          highCount,
        };
        indicatorOptions.push({
          key,
          label: meta?.label || key,
          count: values.length,
          type: 'numeric',
          unit: meta?.unit,
          normalRange,
        });
      }

      for (const [key, data] of Object.entries(categoricalValues)) {
        if (data.total === 0) continue;
        const meta = fieldMetadata[key];
        indicatorOptions.push({
          key,
          label: meta?.label || key,
          count: data.total,
          type: 'categorical',
        });
        if (!categoricalValues[key]) {
          categoricalValues[key] = { positive: 0, negative: 0, other: 0, total: 0 };
        }
      }

      indicatorOptions.sort((a, b) => b.count - a.count);
      const filteredOptions = indicatorOptions.filter(opt => opt.count >= 2);

      setMetrics({
        totalExams: rows.length,
        examsByType,
        examsByDay,
        examsByMonth,
        examsByYear,
        examsByUser,
        indicatorOptions: filteredOptions,
        numericIndicators,
        categoricalIndicators: categoricalValues,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
