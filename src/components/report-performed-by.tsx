import { UserCircle2 } from "lucide-react";

interface PerformedByProps {
  performedBy?: string;
}

export function ReportPerformedBy({ performedBy }: PerformedByProps) {
  if (!performedBy) {
    return null;
  }

  return (
    <section className="mt-2 flex items-center gap-2">
      <UserCircle2 className="h-5 w-5 text-emerald-700" />
      <p className="text-xs font-semibold text-slate-700">{performedBy}</p>
    </section>
  );
}
