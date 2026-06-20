interface PatientInfo {
  patientName: string;
  patientId?: string;
  hcn?: string;
  patientAge?: string;
  date: string;
  sampleDate?: string;
}

interface ReportPatientInfoProps {
  patient: PatientInfo;
}

export function ReportPatientInfo({ patient }: ReportPatientInfoProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section className="space-y-2 pb-3 border-b-2 border-border/50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-sm"></div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Datos del Paciente
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md border border-border/30">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paciente</p>
          <p className="text-sm font-semibold text-foreground">{patient.patientName}</p>
        </div>
        
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DNI</p>
          <p className="text-sm font-semibold text-foreground">{patient.patientId || '-'}</p>
        </div>
        
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">HCN</p>
          <p className="text-sm font-semibold text-foreground">{patient.hcn || '-'}</p>
        </div>

        {patient.sampleDate && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha Muestra</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(patient.sampleDate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
