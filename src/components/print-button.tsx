import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button onClick={handlePrint}>
      <Download className="mr-2 h-4 w-4" />
      Descargar PDF
    </Button>
  );
}
