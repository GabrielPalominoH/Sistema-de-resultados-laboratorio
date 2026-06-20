import { cn } from "@/lib/utils";

interface ResultField {
  key: string;
  label: string;
  value: string;
  suffix?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
}

interface ReportResultsProps {
  results: ResultField[];
  title?: string;
  observations?: string;
}

const TWO_COLUMNS_THRESHOLD = 12;

function ResultItem({ result }: { result: ResultField }) {
  const showAlert = result.isAbnormal;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2 px-2 border-b border-border/30 break-inside-avoid",
        showAlert && "bg-destructive/10"
      )}
    >
      <span className={cn(
        "text-xs font-medium text-foreground flex-1 mr-2",
        showAlert && "text-destructive font-semibold"
      )}>
        {result.label}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn(
          "text-xs font-semibold tabular-nums text-right",
          showAlert ? "text-destructive" : "text-foreground"
        )}>
          {result.value}
          {result.suffix && (
            <span className="text-[10px] font-normal text-muted-foreground ml-1">
              {result.suffix}
            </span>
          )}
        </span>
        {showAlert && (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
            !
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ results }: { results: ResultField[] }) {
  return (
    <div className="divide-y divide-border/20">
      {results.map((result) => (
        <ResultItem key={result.key} result={result} />
      ))}
    </div>
  );
}

function ObservationsBox({ observations }: { observations?: string }) {
  if (!observations) return null;
  
  return (
    <div className="mt-3">
      <div className="py-3 px-3 border border-amber-200 bg-amber-50/50 rounded-md">
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1">
          OBSERVACIONES
        </span>
        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
          {observations}
        </p>
      </div>
    </div>
  );
}

export function ReportResults({ results, title = 'Resultados del Examen', observations }: ReportResultsProps) {
  if (results.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground text-sm">
          No se ingresaron resultados para este examen.
        </p>
      </div>
    );
  }

  const abnormalCount = results.filter(r => r.isAbnormal).length;
  const needsTwoColumns = results.length > TWO_COLUMNS_THRESHOLD;

  if (!needsTwoColumns) {
    return (
      <section className="space-y-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-primary rounded-sm"></div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          {abnormalCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
              {abnormalCount}
            </span>
          )}
        </div>

        <Column results={results} />

        <ObservationsBox observations={observations} />
      </section>
    );
  }

  const midIndex = Math.ceil(results.length / 2);
  const leftColumn = results.slice(0, midIndex);
  const rightColumn = results.slice(midIndex);

  return (
    <section className="space-y-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-primary rounded-sm"></div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {title}
        </h2>
        {abnormalCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
            {abnormalCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        <Column results={leftColumn} />
        <Column results={rightColumn} />
      </div>

      <ObservationsBox observations={observations} />
    </section>
  );
}
