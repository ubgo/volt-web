import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      // Compact density — text-[12px] not text-sm. The label sits above
      // a h-8 Input; text-sm makes the label taller than the input it
      // labels, which reads as misaligned vertical rhythm.
      className={cn(
        "flex items-center gap-2 text-[12px] leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50  peer-[[data-disabled]]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Label };
