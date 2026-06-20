export const examsWithSamples = ['examen-general', 'nino'] as const;

export const maxSamples = 3;

export type ExamTypeWithSamples = typeof examsWithSamples[number];

const examTypeSlugByNormalizedName: Record<string, string> = {
  'hemograma completo': 'hemograma-completo',
  'analisis de alimentos': 'foods',
  'deteccion cualitativa de sangre oculta en heces': 'deteccion-sangre-oculta',
  'examen general': 'examen-general',
  'bioquimico': 'bioquimico',
  'examen nino': 'nino',
};

function normalizeExamType(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function getExamTypeSlug(examType: string): string {
  const normalized = normalizeExamType(examType);
  return examTypeSlugByNormalizedName[normalized] || examType;
}

export function hasMultipleSamples(examType: string): boolean {
  const slug = getExamTypeSlug(examType);
  return examsWithSamples.includes(slug as ExamTypeWithSamples);
}

export function getNextSampleNumber(currentSamples: number): 1 | 2 | 3 | null {
  if (currentSamples >= maxSamples) return null;
  return (currentSamples + 1) as 1 | 2 | 3;
}

export function canAddSample(examType: string, currentSamples: number): boolean {
  return hasMultipleSamples(examType) && currentSamples < maxSamples;
}

export const examTypeSpanish: Record<string, string> = {
  'hemograma-completo': 'Hemograma Completo',
  'foods': 'Análisis de Alimentos',
  'deteccion-sangre-oculta': 'Detección Cualitativa de Sangre Oculta en Heces',
  'examen-general': 'Examen General',
  'bioquimico': 'Bioquímico',
  'nino': 'Examen Niño',
};
