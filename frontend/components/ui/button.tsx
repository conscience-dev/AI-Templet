import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom project color variants - solid
        rd: "bg-rd text-white shadow-sm hover:bg-rd-600",
        blue: "bg-blue text-white shadow-sm hover:bg-blue-600",
        green: "bg-green text-white shadow-sm hover:bg-green-600",
        yellow: "bg-yellow text-white shadow-sm hover:bg-yellow-600",
        purple: "bg-purple text-white shadow-sm hover:bg-purple-600",
        pink: "bg-pink text-white shadow-sm hover:bg-pink-600",
        teal: "bg-teal text-white shadow-sm hover:bg-teal-700",
        indigo: "bg-indigo text-white shadow-sm hover:bg-indigo-700",
        // Custom project color variants - outline
        "rd-outline": "border border-rd text-rd bg-rd-4 hover:bg-rd hover:text-white",
        "blue-outline": "border border-blue text-blue bg-blue-4 hover:bg-blue hover:text-white",
        "green-outline":
          "border border-green text-green bg-green-4 hover:bg-green hover:text-white",
        "yellow-outline":
          "border border-yellow text-yellow bg-yellow-4 hover:bg-yellow hover:text-white",
        "purple-outline":
          "border border-purple text-purple bg-purple-8 hover:bg-purple hover:text-white",
        "pink-outline": "border border-pink text-pink bg-pink-8 hover:bg-pink hover:text-white",
        "teal-outline": "border border-teal text-teal bg-teal-8 hover:bg-teal hover:text-white",
        "indigo-outline":
          "border border-indigo text-indigo bg-indigo-8 hover:bg-indigo hover:text-white",
        // Soft / ghost color variants
        "rd-ghost": "text-rd hover:bg-rd-8",
        "blue-ghost": "text-blue hover:bg-blue-8",
        "green-ghost": "text-green hover:bg-green-8",
        "yellow-ghost": "text-yellow hover:bg-yellow-8",
        "purple-ghost": "text-purple hover:bg-purple-8",
      },
      size: {
        default: "h-9 px-4 py-2 text-bodybtn",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-bodybtn",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
