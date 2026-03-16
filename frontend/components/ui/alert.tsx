import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-caption2 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green/50 bg-green-8 text-green [&>svg]:text-green",
        warning: "border-yellow/50 bg-yellow-8 text-yellow [&>svg]:text-yellow",
        info: "border-blue/50 bg-blue-8 text-blue [&>svg]:text-blue",
        rd: "border-rd/50 bg-rd-8 text-rd [&>svg]:text-rd",
        purple: "border-purple/50 bg-purple-8 text-purple [&>svg]:text-purple",
        pink: "border-pink/50 bg-pink-8 text-pink [&>svg]:text-pink",
        teal: "border-teal/50 bg-teal-8 text-teal [&>svg]:text-teal",
        indigo: "border-indigo/50 bg-indigo-8 text-indigo [&>svg]:text-indigo",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(alertVariants({ variant }), className)} role="alert" {...props} />
));

Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  )
);

AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-caption [&_p]:leading-relaxed", className)} {...props} />
));

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
