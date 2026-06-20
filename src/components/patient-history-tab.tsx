import { useState, useRef, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Loader2, Search, X, TrendingUp, TrendingDown, Minus, UserCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { searchPatientsByDni } from '@/lib/db';
import type { PatientLookupResult } from '@/lib/definitions';
import { usePatientHistory, FIELD_META } from '@/hooks/use-patient-history';

const LINE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
const MAX_FIELDS = 6;

function TrendIcon({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (current > previous) return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
  if (current < previous) return <TrendingDown className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function isInRange(value: number, refMin?: number, refMax?: number): boolean {
  if (refMin !== undefined && value < refMin) return false;
  if (refMax !== undefined && value > refMax) return false;
  return true;
}

export function PatientHistoryTab() {
  const [dniInput, setDniInput] = useState('');
  const [suggestions, setSuggestions] = useState<PatientLookupResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLookupResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, loading, error, fetchHistory, reset } = usePatientHistory();

  const runSearch = useCallback(async (prefix: string) => {
    if (prefix.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchPatientsByDni(prefix.trim());
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleDniChange = (value: string) => {
    setDniInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  };

  const handleSelectPatient = (patient: PatientLookupResult) => {
    setSelectedPatient(patient);
    setDniInput(patient.dni ?? '');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedFields([]);
    if (patient.dni) fetchHistory(patient.dni, patient.fullName);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setDniInput('');
    setSelectedFields([]);
    reset();
  };

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_FIELDS) return prev;
      return [...prev, key];
    });
  };

  const groupedFields = useMemo(() => {
    if (!data?.availableFields) return {};
    return data.availableFields.reduce<Record<string, typeof data.availableFields>>((acc, field) => {
      const cat = field.category || 'Otros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(field);
      return acc;
    }, {});
  }, [data?.availableFields]);

  const chartDataByField = useMemo(() => {
    if (!data?.dataPoints) return {};
    const result: Record<string, { date: string; value: number; examType: string }[]> = {};
    for (const field of selectedFields) {
      result[field] = data.dataPoints
        .filter((p) => p.values[field] !== undefined)
        .map((p) => ({ date: p.date, value: p.values[field], examType: p.examType }));
    }
    return result;
  }, [data?.dataPoints, selectedFields]);

  return (
    <div className="space-y-6">
      {/* Patient search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar Paciente</CardTitle>
          <CardDescription>Ingresa el DNI para ver el historial clínico</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <UserCircle2 className="h-9 w-9 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedPatient.fullName}</p>
                <p className="text-sm text-muted-foreground">DNI {selectedPatient.dni} · {selectedPatient.age} años</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClearPatient} title="Cambiar paciente">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={dniInput}
                  onChange={(e) => handleDniChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Buscar por DNI..."
                  className="pl-9 pr-9"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {showSuggestions && (
                <div
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-52 overflow-y-auto"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {suggestions.map((p) => (
                    <button
                      key={p.dni}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted flex items-center gap-3 border-b last:border-b-0"
                      onClick={() => handleSelectPatient(p)}
                    >
                      <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{p.dni}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.age} años</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {/* No exams */}
      {data && data.totalExams === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Sin registros clínicos</p>
            <p className="text-sm mt-1">{data.patientName} no tiene exámenes registrados aún.</p>
          </CardContent>
        </Card>
      )}

      {/* Data loaded */}
      {data && data.totalExams > 0 && (
        <>
          {/* Summary strip */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {data.totalExams} {data.totalExams === 1 ? 'examen' : 'exámenes'} registrados
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {data.availableFields.length} campos con datos en este paciente
            </Badge>
          </div>

          {/* Field selector */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Campos a Graficar</CardTitle>
                  <CardDescription>
                    Selecciona hasta {MAX_FIELDS} campos · {selectedFields.length} seleccionados
                  </CardDescription>
                </div>
                {selectedFields.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFields([])}>
                    Limpiar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedFields).length === 0 ? (
                <p className="text-sm text-muted-foreground">No se encontraron campos numéricos en los exámenes de este paciente.</p>
              ) : (
                <div className="divide-y divide-border">
                  {Object.entries(groupedFields).map(([category, fields]) => (
                    <div key={category} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{category}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
                        {fields.map((field: any) => {
                          const idx = selectedFields.indexOf(field.key);
                          const isSelected = idx !== -1;
                          const isDisabled = !isSelected && selectedFields.length >= MAX_FIELDS;
                          const color = isSelected ? LINE_COLORS[idx % LINE_COLORS.length] : undefined;
                          return (
                            <div
                              key={field.key}
                              className={`flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors ${isSelected ? 'bg-muted/60' : 'hover:bg-muted/30'}`}
                            >
                              <Checkbox
                                id={`field-${field.key}`}
                                checked={isSelected}
                                disabled={isDisabled}
                                onCheckedChange={() => toggleField(field.key)}
                                className="mt-0.5 shrink-0"
                                style={color ? { borderColor: color, backgroundColor: color } as React.CSSProperties : undefined}
                              />
                              <Label
                                htmlFor={`field-${field.key}`}
                                className={`text-sm leading-tight cursor-pointer select-none ${isDisabled ? 'text-muted-foreground' : ''}`}
                              >
                                <span className="block">{field.label}</span>
                                <span className="text-muted-foreground text-xs">
                                  {field.unit && `${field.unit} · `}{field.count} {field.count === 1 ? 'registro' : 'registros'}
                                </span>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts grid */}
          {selectedFields.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              Selecciona al menos un campo para ver la gráfica
            </div>
          )}

          {selectedFields.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {selectedFields.map((fieldKey, idx) => {
                const meta = (FIELD_META as Record<string, any>)[fieldKey];
                const chartPoints = chartDataByField[fieldKey] ?? [];
                const color = LINE_COLORS[idx % LINE_COLORS.length];
                const values = chartPoints.map((p) => p.value);
                const latest = values[values.length - 1];
                const previous = values[values.length - 2];
                const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
                const inRange = latest !== undefined && isInRange(latest, meta?.refMin, meta?.refMax);

                // Y axis domain with padding
                const minVal = values.length > 0 ? Math.min(...values) : 0;
                const maxVal = values.length > 0 ? Math.max(...values) : 1;
                const padding = (maxVal - minVal) * 0.2 || 1;
                const yMin = Math.max(0, Math.floor(Math.min(minVal, meta?.refMin ?? minVal) - padding));
                const yMax = Math.ceil(Math.max(maxVal, meta?.refMax ?? maxVal) + padding);

                return (
                  <Card key={fieldKey} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {meta?.label ?? fieldKey}
                            {meta?.unit && (
                              <span className="text-xs font-normal text-muted-foreground">({meta.unit})</span>
                            )}
                          </CardTitle>
                          {(meta?.refMin !== undefined || meta?.refMax !== undefined) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Ref:{' '}
                              {meta.refMin !== undefined && meta.refMax !== undefined
                                ? `${meta.refMin} – ${meta.refMax}`
                                : meta.refMin !== undefined
                                ? `≥ ${meta.refMin}`
                                : `≤ ${meta.refMax}`}
                              {meta.unit ? ` ${meta.unit}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {latest !== undefined && (
                            <>
                              <p
                                className="text-lg font-bold leading-none"
                                style={{ color: (meta?.refMin !== undefined || meta?.refMax !== undefined) ? (inRange ? '#16a34a' : '#dc2626') : color }}
                              >
                                {latest.toFixed(1)}
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <TrendIcon current={latest} previous={previous} />
                                <span className="text-xs text-muted-foreground">último</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {values.length > 1 && (
                        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                          <span>Prom: <strong>{avg.toFixed(1)}</strong></span>
                          <span>Mín: <strong>{Math.min(...values).toFixed(1)}</strong></span>
                          <span>Máx: <strong>{Math.max(...values).toFixed(1)}</strong></span>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-0 pb-4">
                      {chartPoints.length < 2 ? (
                        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                          {chartPoints.length === 0
                            ? 'Este paciente no tiene datos registrados para este campo'
                            : '1 punto de datos — se necesitan al menos 2 para graficar'}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartPoints} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={[yMin, yMax]}
                              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                              tickLine={false}
                              axisLine={false}
                              width={36}
                            />
                            <Tooltip
                              contentStyle={{
                                fontSize: 12,
                                borderRadius: 6,
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--background))',
                              }}
                              formatter={(value: number) => [`${value.toFixed(2)} ${meta?.unit ?? ''}`, meta?.label ?? fieldKey]}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />

                            {/* Normal range band */}
                            {meta?.refMin !== undefined && meta?.refMax !== undefined && (
                              <ReferenceArea
                                y1={meta.refMin}
                                y2={meta.refMax}
                                fill="#16a34a"
                                fillOpacity={0.07}
                                strokeOpacity={0}
                              />
                            )}
                            {meta?.refMin !== undefined && (
                              <ReferenceLine
                                y={meta.refMin}
                                stroke="#16a34a"
                                strokeDasharray="4 3"
                                strokeWidth={1}
                                strokeOpacity={0.6}
                              />
                            )}
                            {meta?.refMax !== undefined && (
                              <ReferenceLine
                                y={meta.refMax}
                                stroke="#16a34a"
                                strokeDasharray="4 3"
                                strokeWidth={1}
                                strokeOpacity={0.6}
                              />
                            )}

                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={color}
                              strokeWidth={2}
                              dot={{ fill: color, r: 4, strokeWidth: 0 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
