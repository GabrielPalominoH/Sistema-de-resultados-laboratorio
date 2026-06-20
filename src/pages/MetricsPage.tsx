import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMetrics, type FilterOptions } from '@/hooks/use-metrics';
import { BarChart3, Calendar, TrendingUp, Users, X } from 'lucide-react';
import { PatientHistoryTab } from '@/components/patient-history-tab';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const chartPalette = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#c2410c'];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function getPeriodLabel(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return 'all';
  if (dateFrom === dateTo && dateFrom === todayStr()) return 'today';
  const diffMs = Date.now() - new Date(dateFrom + 'T12:00:00').getTime();
  if (diffMs < 7 * 86_400_000) return 'week';
  if (diffMs < 30 * 86_400_000) return 'month';
  return 'year';
}

export default function MetricsPage() {
  const { metrics, loading, error, refetch } = useMetrics();
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const applyDateFilter = (from: string, to: string, currentFilters: FilterOptions) => {
    const newFilters = { ...currentFilters };
    if (from || to) {
      newFilters.dateRange = {};
      if (from) newFilters.dateRange.from = from;
      if (to) newFilters.dateRange.to = to;
    } else {
      delete newFilters.dateRange;
    }
    setFilters(newFilters);
    refetch(newFilters);
  };

  const handlePeriodShortcut = (value: string) => {
    if (value === 'all') {
      setDateFrom('');
      setDateTo('');
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      setFilters(newFilters);
      refetch(newFilters);
      return;
    }

    const today = todayStr();
    let from = today;

    switch (value) {
      case 'today':
        break;
      case 'week':
        from = nDaysAgo(7);
        break;
      case 'month':
        from = nDaysAgo(30);
        break;
      case 'year':
        from = nDaysAgo(365);
        break;
    }

    setDateFrom(from);
    setDateTo(today);

    const newFilters = { ...filters, dateRange: { from, to: today } };
    setFilters(newFilters);
    refetch(newFilters);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    applyDateFilter(value, dateTo, filters);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    applyDateFilter(dateFrom, value, filters);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    const newFilters: FilterOptions = {};
    setFilters(newFilters);
    refetch(newFilters);
  };

  const examTypes = Object.keys(metrics?.examsByType || {});
  const months = Object.keys(metrics?.examsByMonth || {}).sort().reverse();
  const years = Object.keys(metrics?.examsByYear || {}).sort().reverse();

  useEffect(() => {
    if (!metrics?.indicatorOptions?.length) {
      setSelectedIndicator('');
      return;
    }

    const currentExists = metrics.indicatorOptions.some((option) => option.key === selectedIndicator);
    if (!currentExists) {
      setSelectedIndicator(metrics.indicatorOptions[0].key);
    }
  }, [metrics?.indicatorOptions, selectedIndicator]);

  const selectedIndicatorMeta = useMemo(
    () => metrics?.indicatorOptions.find((option) => option.key === selectedIndicator),
    [metrics?.indicatorOptions, selectedIndicator]
  );

  const selectedIsNumeric = selectedIndicatorMeta?.type === 'numeric';

  const numericData = useMemo(
    () => metrics?.numericIndicators[selectedIndicator],
    [metrics?.numericIndicators, selectedIndicator]
  );

  const categoricalData = useMemo(
    () => metrics?.categoricalIndicators[selectedIndicator] || { positive: 0, negative: 0, other: 0, total: 0 },
    [metrics?.categoricalIndicators, selectedIndicator]
  );

  const numericChartData = useMemo(() => {
    if (!numericData) return [];
    const { normalRange } = selectedIndicatorMeta || {};
    if (normalRange) {
      return [
        { range: `Bajo (<${normalRange.low})`, count: numericData.lowCount, fill: '#dc2626' },
        { range: `Normal (${normalRange.low}-${normalRange.high})`, count: numericData.normalCount, fill: '#16a34a' },
        { range: `Alto (>${normalRange.high})`, count: numericData.highCount, fill: '#d97706' },
      ];
    }
    return [];
  }, [numericData, selectedIndicatorMeta]);

  const numericChartDataFallback = useMemo(() => {
    if (!numericData) return [];
    return [
      { range: 'Mínimo', value: numericData.min, fill: '#3b82f6' },
      { range: 'Promedio', value: numericData.average, fill: '#8b5cf6' },
      { range: 'Máximo', value: numericData.max, fill: '#f59e0b' },
    ];
  }, [numericData]);

  const categoricalChartData = useMemo(
    () => [
      { name: 'Positivos', value: categoricalData.positive, fill: '#dc2626' },
      { name: 'Negativos', value: categoricalData.negative, fill: '#16a34a' },
      { name: 'Otros', value: categoricalData.other, fill: '#2563eb' },
    ],
    [categoricalData]
  );

  const examTypeChartData = useMemo(
    () =>
      Object.entries(metrics?.examsByType || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([type, count]) => ({ type, count })),
    [metrics?.examsByType]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas del Sistema</h1>
          <p className="text-muted-foreground">KPIs y gráficas para decisiones clínicas y campañas preventivas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full md:w-56">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Tipo de Examen</Label>
              <Select value={filters.examType || 'all'} onValueChange={(v) => {
                const nf = { ...filters };
                if (v === 'all') delete nf.examType;
                else nf.examType = v;
                setFilters(nf);
                refetch(nf);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Examen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-44"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-44"
              />
            </div>

            <Button variant="outline" size="icon" onClick={clearFilters} title="Limpiar filtros">
              <X className="h-4 w-4" />
            </Button>

            <div className="w-full md:w-56">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Acceso rápido</Label>
              <Select value={getPeriodLabel(dateFrom, dateTo)} onValueChange={handlePeriodShortcut}>
                <SelectTrigger>
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Exámenes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalExams || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tipos Distintos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examTypes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exámenes del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.examsByMonth[months[0] || ''] || 0}</div>
            <p className="text-xs text-muted-foreground">{months[0] || 'Sin datos'}</p>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="clinical">Indicadores Clínicos</TabsTrigger>
          <TabsTrigger value="users">Por Personal</TabsTrigger>
          <TabsTrigger value="history">Historial de Paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Exámenes Más Realizados</CardTitle>
                <CardDescription>Top de examenes por volumen</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examTypeChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" width={170} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Exámenes">
                      {examTypeChartData.map((_, index) => (
                        <Cell key={`type-${index}`} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Indicadores Clínicos</CardTitle>
                  <CardDescription>Seleccione un indicador para visualizar</CardDescription>
                </div>
                <div className="w-full sm:w-72">
                  <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar indicador" />
                    </SelectTrigger>
                    <SelectContent>
                      {(metrics?.indicatorOptions || []).map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label} ({option.count}) {option.type === 'numeric' ? '(numérico)' : '(categórico)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedIsNumeric ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Mínimo</p>
                        <p className="text-2xl font-bold text-blue-600">{numericData?.min.toFixed(1)} {selectedIndicatorMeta?.unit || ''}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Promedio</p>
                        <p className="text-2xl font-bold text-purple-600">{numericData?.average.toFixed(1)} {selectedIndicatorMeta?.unit || ''}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="text-2xl font-bold text-amber-600">{numericData?.max.toFixed(1)} {selectedIndicatorMeta?.unit || ''}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total con valor</p>
                        <p className="text-2xl font-bold text-green-600">{numericData?.totalWithValue || 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {selectedIndicatorMeta?.normalRange ? (
                    <div className="h-[450px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={numericChartData}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                           <YAxis />
                           <Tooltip />
                           <Bar dataKey="count" name="Pacientes">
                             {numericChartData.map((entry) => (
                               <Cell key={entry.range} fill={entry.fill} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   ) : (
                     <div className="h-[450px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={numericChartDataFallback}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                           <YAxis />
                           <Tooltip />
                           <Bar dataKey="value" name={selectedIndicatorMeta?.label || 'Indicador'}>
                             {numericChartDataFallback.map((entry) => (
                               <Cell key={entry.range} fill={entry.fill} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <Card className="border-red-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Positivos</p>
                        <p className="text-2xl font-bold text-red-600">{categoricalData.positive}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Negativos</p>
                        <p className="text-2xl font-bold text-green-600">{categoricalData.negative}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Otros</p>
                        <p className="text-2xl font-bold text-blue-600">{categoricalData.other}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="h-[450px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={categoricalChartData}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="name" />
                         <YAxis />
                         <Tooltip />
                         <Legend />
                         <Bar dataKey="value" name={selectedIndicatorMeta?.label || 'Indicador'}>
                           {categoricalChartData.map((entry) => (
                             <Cell key={entry.name} fill={entry.fill} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exámenes por Personal</CardTitle>
              <CardDescription>Carga de registros por usuario del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.examsByUser.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="truncate">{user.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(user.count / (metrics?.totalExams || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{user.count}</span>
                    </div>
                  </div>
                ))}

                {(!metrics?.examsByUser || metrics.examsByUser.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No hay datos de usuarios para mostrar</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {months.slice(0, 12).map((month) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm">{month}</span>
                      <span className="font-medium">{metrics?.examsByMonth[month] || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {years.map((year) => (
                    <div key={year} className="flex items-center justify-between">
                      <span className="text-sm">{year}</span>
                      <span className="font-medium">{metrics?.examsByYear[year] || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <PatientHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
