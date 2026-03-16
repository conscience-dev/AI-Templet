import { cva } from "class-variance-authority";

export const title = cva("tracking-tight inline font-semibold", {
  variants: {
    color: {
      violet: "bg-clip-text text-transparent bg-gradient-to-b from-[#FF1CF7] to-[#b249f8]",
      yellow: "bg-clip-text text-transparent bg-gradient-to-b from-[#FF705B] to-[#FFB457]",
      blue: "bg-clip-text text-transparent bg-gradient-to-b from-[#5EA2EF] to-[#0072F5]",
      cyan: "bg-clip-text text-transparent bg-gradient-to-b from-[#00b7fa] to-[#01cfea]",
      green: "bg-clip-text text-transparent bg-gradient-to-b from-[#6FEE8D] to-[#17c964]",
      pink: "bg-clip-text text-transparent bg-gradient-to-b from-[#FF72E1] to-[#F54C7A]",
      foreground:
        "bg-clip-text text-transparent bg-gradient-to-b dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const subtitle = cva(
  "w-full md:w-1/2 my-2 text-lg lg:text-xl text-neutral-500 block max-w-full",
  {
    variants: {
      fullWidth: {
        true: "!w-full",
      },
    },
    defaultVariants: {
      fullWidth: true,
    },
  }
);
