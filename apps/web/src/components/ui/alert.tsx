import * as React from "react";
import { cn } from "@/src/lib/utils";

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Alert(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80",
        className
      )}
      {...props}
    />
  );
});

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return <p ref={ref} className={cn("leading-relaxed text-white/70", className)} {...props} />;
  }
);

export { Alert, AlertDescription };
