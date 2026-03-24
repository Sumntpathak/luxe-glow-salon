import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:opacity-90 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110",
        outline:
          "border-border bg-card hover:bg-secondary hover:border-primary/30 hover:shadow-sm dark:bg-card/60 dark:hover:bg-secondary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 shadow-sm",
        ghost:
          "hover:bg-muted/60 hover:text-foreground",
        destructive:
          "bg-destructive text-white shadow-md shadow-destructive/25 hover:shadow-lg hover:shadow-destructive/30 hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 px-2.5 text-xs rounded-lg gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-6 text-base rounded-2xl gap-2.5",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
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
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
