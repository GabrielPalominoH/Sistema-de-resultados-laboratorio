import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  }

  return (
    <div
      className={cn(
        "animate-shimmer bg-muted/50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

// Skeleton variants for common use cases
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="rectangular" className="h-20 w-full" />
    </div>
  )
}

function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" className={i === 0 ? "w-20" : "w-full"} />
        </td>
      ))}
    </tr>
  )
}

function SkeletonInput({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton variant="text" className="w-20 h-4" />
      <Skeleton variant="rectangular" className="h-10 w-full" />
    </div>
  )
}

function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton variant="rectangular" className={cn("h-10 w-24", className)} />
}

export { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonInput, SkeletonButton }
