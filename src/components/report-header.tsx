import { FlaskConical } from 'lucide-react';

interface ReportHeaderProps {
  examType: string;
}

export function ReportHeader({ examType }: ReportHeaderProps) {
  return (
    <header className="space-y-4 pb-4 border-b-4 border-primary">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-10 w-10 text-primary" />
          <div className="text-left">
            <p className="text-lg font-bold text-foreground">Laboratorio</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">CLAS MARCONA</p>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-1 pt-1">
        <h1 className="text-base font-bold text-foreground tracking-wide">
          CENTRO DE SALUD "JOSE PASETA BAR"
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          RESULTADOS DE LABORATORIO CLÍNICO
        </p>
      </div>

      <div className="flex justify-center">
        <span className="text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-6 py-2 rounded-full">
          {examType}
        </span>
      </div>
    </header>
  );
}
