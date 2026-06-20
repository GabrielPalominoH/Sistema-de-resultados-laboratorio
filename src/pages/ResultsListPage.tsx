import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResultsDataTable } from '@/components/results-data-table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getResults, deleteResult } from '@/lib/db';
import type { LabResult } from '@/lib/definitions';

export default function ResultsListPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getResults()
      .then(setResults)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await deleteResult(id);
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resultados de Laboratorio</h1>
          <p className="text-muted-foreground">Busque, vea y gestione todos los resultados de los pacientes.</p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Reporte
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <ResultsDataTable data={results} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  );
}
