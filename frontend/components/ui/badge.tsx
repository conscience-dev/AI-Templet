import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        // Custom project color variants
        rd: "border-transparent bg-rd-8 text-rd",
        blue: "border-transparent bg-blue-8 text-blue",
        green: "border-transparent bg-green-8 text-green",
        yellow: "border-transparent bg-yellow-8 text-yellow",
        purple: "border-transparent bg-purple-8 text-purple",
        pink: "border-transparent bg-pink-8 text-pink",
        teal: "border-transparent bg-teal-8 text-teal",
        indigo: "border-transparent bg-indigo-8 text-indigo",
        lime: "border-transparent bg-lime-8 text-lime",
        // Solid color variants
        "rd-solid": "border-transparent bg-rd text-white",
        "blue-solid": "border-transparent bg-blue text-white",
        "green-solid": "border-transparent bg-green text-white",
        "yellow-solid": "border-transparent bg-yellow text-white",
        "purple-solid": "border-transparent bg-purple text-white",
        "pink-solid": "border-transparent bg-pink text-white",
        "teal-solid": "border-transparent bg-teal text-white",
        "indigo-solid": "border-transparent bg-indigo text-white",
        // Role variants for organization/project member roles
        owner: "border-transparent bg-rd-8 text-rd",
        developer: "border-transparent bg-blue-8 text-blue",
        viewer: "border-transparent bg-green-8 text-green",
        admin: "border-transparent bg-purple-8 text-purple",
        // Status variants
        active: "border-transparent bg-green-8 text-green",
        pending: "border-transparent bg-yellow-8 text-yellow",
        expired: "border-transparent bg-rd-8 text-rd",
        rejected: "border-transparent bg-secondary text-muted-foreground",
        inactive: "border-transparent bg-secondary text-sv",
        warning: "border-transparent bg-yellow-8 text-yellow",
        info: "border-transparent bg-blue-8 text-blue",
        success: "border-transparent bg-green-8 text-green",
        error: "border-transparent bg-rd-8 text-rd",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
