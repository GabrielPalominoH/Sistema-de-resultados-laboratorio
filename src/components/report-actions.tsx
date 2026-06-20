import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface ReportActionsProps {
  onPrint?: () => void;
}

export function ReportActions({ onPrint }: ReportActionsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button 
        variant="outline" 
        onClick={handlePrint}
        className="hover-lift"
      >
        <Printer className="mr-2 h-4 w-4" />
        Imprimir
      </Button>
      <Button 
        variant="outline"
        onClick={() => window.print()}
        className="hover-lift"
      >
        <Download className="mr-2 h-4 w-4" />
        Guardar PDF
      </Button>
    </div>
  );
}
