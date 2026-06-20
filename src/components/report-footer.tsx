import { UserCircle2 } from "lucide-react";

interface ReportFooterProps {
  generatedAt?: string;
  performedBy?: string;
}

export function ReportFooter({ generatedAt, performedBy }: ReportFooterProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <footer className="mt-6 pt-4 border-t-2 border-border">
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-10 w-10 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">{performedBy || 'Responsable'}</p>
            <p className="text-[10px] text-muted-foreground">Lic. Laboratorio Clínico</p>
          </div>
        </div>
        <div className="w-32 border-t-2 border-border pt-2 text-center">
          <p className="text-[9px] text-muted-foreground/60">sellos</p>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-border/30 text-center">
        <p className="text-[8px] text-muted-foreground/50">
          {generatedAt ? `Generado: ${formatDate(generatedAt)}` : ''}
        </p>
      </div>
    </footer>
  );
}
