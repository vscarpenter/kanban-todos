import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/20",
        outline:
          "border border-border bg-surface hover:bg-surface-2 hover:text-foreground",
        secondary:
          "bg-surface-2 text-foreground hover:bg-surface-2/80",
        ghost:
          "hover:bg-surface-2 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[45px] px-4 py-2 sm:h-9 sm:min-h-0 has-[>svg]:px-3",
        sm: "min-h-[45px] rounded-md gap-1.5 px-3 sm:h-8 sm:min-h-0 has-[>svg]:px-2.5",
        lg: "min-h-[45px] rounded-md px-6 sm:h-10 sm:min-h-0 has-[>svg]:px-4",
        icon: "size-[45px] sm:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
