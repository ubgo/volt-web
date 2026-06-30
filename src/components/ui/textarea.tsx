import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      // Matches the Input primitive: flat 1px border, NO shadow, bg-background,
      // text-[12px], and the same 1px focus ring — so textareas and inputs read
      // as siblings in a form. (Was the chunky shadcn default: shadow-xs +
      // bg-transparent + text-base + 3px ring, which drifted against Input.)
      className={cn(
        "border-input placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-background px-(--control-padding-x) py-1.5 text-(length:--control-font-size) transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
