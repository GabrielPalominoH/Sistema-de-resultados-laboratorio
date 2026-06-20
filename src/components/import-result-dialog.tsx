import { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { ReportHeader } from '@/components/report-header'
import { ReportPatientInfo } from '@/components/report-patient-info'
import { ReportResults } from '@/components/report-results'
import { ReportFooter } from '@/components/report-footer'
import { getFieldLabel, getFieldSuffix } from '@/lib/field-labels'

export interface ImportedRow {
  patientName: string
  patientId: string
  hcn: string
  patientAge: string
  examType: string
  date: string
  resultado: string
  observaciones: string
  extraFields: Record<string, string>
}

interface ImportResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ImportedRow
}

export function ImportResultDialog({ open, onOpenChange, data }: ImportResultDialogProps) {
  const printableRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const resultFields = [
    ...(data.resultado
      ? [{ key: 'resultado', label: 'Resultado', value: data.resultado, suffix: getFieldSuffix('resultado') }]
      : []),
    ...Object.entries(data.extraFields).map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      value,
      suffix: getFieldSuffix(key),
    })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Detalle del Resultado</DialogTitle>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogHeader>
        <div ref={printableRef} className="bg-slate-50">
          <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg">
            <div className="space-y-5">
              <ReportHeader examType={data.examType} />

              <ReportPatientInfo
                patient={{
                  patientName: data.patientName,
                  patientId: data.patientId,
                  hcn: data.hcn || undefined,
                  patientAge: data.patientAge || undefined,
                  date: data.date,
                }}
              />

              <ReportResults
                results={resultFields}
                observations={data.observaciones || undefined}
              />

              <ReportFooter generatedAt={new Date().toISOString()} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
