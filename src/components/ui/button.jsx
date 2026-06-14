import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary-gradient text-on-primary hover:opacity-90 shadow-sm",
        outline:
          "bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container-high hover:text-on-surface",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:opacity-90",
        ghost:
          "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        destructive:
          "bg-error-container text-on-error-container hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 text-xs font-medium rounded-lg",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-lg px-2.5 text-[0.8rem]",
        lg: "h-9 gap-1.5 px-4 text-sm",
        icon: "size-8",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-7 rounded-lg",
        "icon-lg": "size-9",
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
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
