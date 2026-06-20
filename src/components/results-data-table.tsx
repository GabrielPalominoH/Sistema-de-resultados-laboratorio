import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LabResult } from "@/lib/definitions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Pencil, FileDown, Upload, FileSpreadsheet } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { AdminOnly } from "@/components/role-gate"
import { useRole } from "@/hooks/use-role"
import { getExamTypeSlug } from "@/lib/exam-config"
import * as XLSX from 'xlsx'
import { save } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImportResultDialog, type ImportedRow } from './import-result-dialog'

interface ResultsDataTableProps {
  data: LabResult[];
  onDelete: (id: string) => void;
}

export function ResultsDataTable({ data, onDelete }: ResultsDataTableProps) {
  const [nameFilter, setNameFilter] = React.useState("")
  const [dniFilter, setDniFilter] = React.useState("")
  const [resultTypeFilter, setResultTypeFilter] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [showExportSuccess, setShowExportSuccess] = React.useState(false)
  const [exportedFileName, setExportedFileName] = React.useState("")
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, canEditExam } = useRole();

  const resultTypeOptions = React.useMemo(
    () => Array.from(new Set(data.map(item => item.examType).filter(Boolean))).sort(),
    [data]
  );

  const parseDate = (value?: string): number | null => {
    if (!value) return null;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  const filteredData = data.filter((item) => {
    const patientName = item.patientName?.toLowerCase() || "";
    const patientId = item.patientId?.toLowerCase() || "";
    const examType = item.examType || "";

    if (nameFilter && !patientName.includes(nameFilter.toLowerCase())) {
      return false;
    }

    if (dniFilter && !patientId.includes(dniFilter.toLowerCase())) {
      return false;
    }

    if (resultTypeFilter !== "all" && examType !== resultTypeFilter) {
      return false;
    }

    if (dateFrom || dateTo) {
      const itemDate = parseDate(item.date);
      if (!itemDate) {
        return false;
      }

      const from = parseDate(dateFrom);
      const to = parseDate(dateTo);

      if (from && itemDate < from) {
        return false;
      }

      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay.getTime()) {
          return false;
        }
      }
    }

    return true;
  });

  const canEditThisResult = (examType: string): boolean => {
    return isAdmin || canEditExam(examType);
  };

  const confirmDelete = (id: string, _patientName: string) => {
    setDeleteId(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      try {
        onDelete(deleteId);
        toast({ title: "Éxito", description: "Resultado eliminado exitosamente." });
        setDeleteId(null);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el resultado." });
      }
    }
  };

  const getPatientName = (id: string) => {
    const result = data.find(r => r.id === id);
    return result?.patientName || '';
  };

  const baseFieldKeys = new Set([
    'id', 'patientName', 'patientId', 'examType', 'date', 'sampleDate',
    'patientAge', 'hcn', 'phone', 'resultado', 'observaciones',
    'data', 'createdAt', 'updatedAt', 'createdBy',
  ]);

  const [importedData, setImportedData] = React.useState<ImportedRow[]>([])
  const [selectedImportRow, setSelectedImportRow] = React.useState<ImportedRow | null>(null)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const parseResultadoCol = (resultado: string): { summary: string; fields: Record<string, string> } => {
    if (!resultado) return { summary: '', fields: {} }
    const lines = resultado.split('\n').filter(Boolean)
    const summaryLines: string[] = []
    const fields: Record<string, string> = {}
    for (const line of lines) {
      const colonIdx = line.indexOf(': ')
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim()
        const value = line.slice(colonIdx + 2).trim()
        if (key && value) { fields[key] = value; continue }
      }
      summaryLines.push(line)
    }
    return { summary: summaryLines.join('\n'), fields }
  }

  const handleImportFile = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)
      const getVal = (row: Record<string, string>, ...keys: string[]) => {
        for (const key of keys) { const v = row[key] || row[key.toLowerCase()]; if (v) return String(v).trim() }
        return ''
      }
      const parsed: ImportedRow[] = rows
        .filter((r) => { const n = getVal(r, 'Paciente', 'patientName'); return !!n && n !== '#' })
        .map((r) => {
          const { summary, fields } = parseResultadoCol(getVal(r, 'Resultado', 'resultado'))
          return {
            patientName: getVal(r, 'Paciente', 'patientName'),
            patientId: getVal(r, 'DNI', 'patientId'),
            hcn: getVal(r, 'HCN', 'hcn'),
            patientAge: getVal(r, 'Edad', 'patientAge'),
            examType: getVal(r, 'Tipo de Examen', 'examType'),
            date: getVal(r, 'Fecha', 'date'),
            resultado: summary,
            observaciones: getVal(r, 'Observaciones', 'observaciones'),
            extraFields: fields,
          }
        })
      setImportedData(parsed)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [])

  const handleViewImportDetail = (row: ImportedRow) => {
    setSelectedImportRow(row)
    setImportDialogOpen(true)
  }

  const exportToExcel = React.useCallback(async () => {
    const sorted = [...filteredData].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    const rows = sorted.map((result, index) => {
      const resultadoParts: string[] = [];
      if (result.resultado) {
        resultadoParts.push(result.resultado);
      }

      const extraFields = Object.entries(result)
        .filter(([key]) => !baseFieldKeys.has(key))
        .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 0);

      if (extraFields.length > 0) {
        const formattedLines = extraFields.map(([key, value]) => `${key}: ${value}`);
        resultadoParts.push(formattedLines.join('\n'));
      }

      return {
        '#': index + 1,
        'Paciente': result.patientName || '',
        'DNI': result.patientId || '',
        'HCN': result.hcn || '',
        'Edad': result.patientAge || '',
        'Tipo de Examen': result.examType || '',
        'Fecha': result.date || '',
        'Resultado': resultadoParts.join('\n\n'),
        'Observaciones': result.observaciones || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 8 },
      { wch: 28 },
      { wch: 15 },
      { wch: 55 },
      { wch: 35 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `resultados_${dateStr}.xlsx`;

    // Show native save dialog
    const filePath = await save({
      filters: [{ name: 'Archivo Excel', extensions: ['xlsx'] }],
      defaultPath: fileName,
    });

    if (!filePath) return; // User cancelled

    try {
      // Write workbook and save to chosen path
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }) as string;
      await invoke('export_excel', { path: filePath, dataBase64: base64 });

      setExportedFileName(fileName);
      setShowExportSuccess(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
      console.error("Export error:", error);
    }
  }, [filteredData]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Filtrar por nombre..."
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
        />
        <Input
          placeholder="Filtrar por DNI..."
          value={dniFilter}
          onChange={(event) => setDniFilter(event.target.value)}
        />
        <Select value={resultTypeFilter} onValueChange={setResultTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {resultTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          aria-label="Fecha desde"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          aria-label="Fecha hasta"
        />
      </div>
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          {/* Botón Importar Excel oculto visualmente
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          */}
        </div>
        <Button
          variant="outline"
          onClick={exportToExcel}
          disabled={filteredData.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {importedData.length > 0 && (
        <Card className="mb-4 mx-4 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Resultados Importados ({importedData.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Tipo de Examen</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.patientName}</TableCell>
                    <TableCell>{row.patientId}</TableCell>
                    <TableCell>{row.examType}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewImportDetail(row)}>
                        <Eye className="mr-1 h-3 w-3" />
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Paciente</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Tipo de Examen</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((result) => {
                const slug = getExamTypeSlug(result.examType);
                return (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.patientName}</TableCell>
                  <TableCell>{result.patientId}</TableCell>
                  <TableCell>{result.examType}</TableCell>
                  <TableCell>{result.date}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/results/${result.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {canEditThisResult(result.examType) && slug && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/exam/${slug}/${result.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <AdminOnly>
                          <DropdownMenuItem onClick={() => confirmDelete(result.id, result.patientName)} className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </AdminOnly>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedImportRow && (
        <ImportResultDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          data={selectedImportRow}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el resultado de {getPatientName(deleteId || '')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportación exitosa</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo <strong>{exportedFileName}</strong> se ha guardado correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowExportSuccess(false)}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    )
  }
