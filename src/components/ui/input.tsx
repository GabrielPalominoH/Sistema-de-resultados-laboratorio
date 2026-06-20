import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onWheel, error, success, ...props }, ref) => {
    const handleWheel: React.WheelEventHandler<HTMLInputElement> = (event) => {
      if (type === "number") {
        event.currentTarget.blur()
      }
      onWheel?.(event)
    }

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-base ring-offset-background transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "hover:border-primary/50 focus:hover:border-primary",
            error && "border-destructive focus-visible:ring-destructive hover:border-destructive/50",
            success && "border-green-500 focus-visible:ring-green-500",
            type === "number" && "[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            className
          )}
          ref={ref}
          onWheel={handleWheel}
          aria-invalid={!!error}
          {...props}
        />
        {success && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {error && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
