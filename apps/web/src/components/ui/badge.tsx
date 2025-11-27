import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neon-blue/30 text-neon-blue hover:bg-neon-blue/40 shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-slate-700/50 text-gray-200 hover:bg-slate-700/70 shadow-sm",
        destructive:
          "border-transparent bg-red-500/30 text-red-400 hover:bg-red-500/40 shadow-sm",
        outline: "text-white border-slate-600/50 hover:bg-slate-800/50 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
