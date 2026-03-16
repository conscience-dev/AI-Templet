/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ──── Red (rd) ── 부드러운 코랄 레드 ────
        rd: {
          DEFAULT: "#F0635C",
          50: "#FEF5F4",
          100: "#FDE8E7",
          200: "#FBD0CE",
          300: "#F7ABA7",
          400: "#F3867F",
          500: "#F0635C",
          600: "#D9443D",
          700: "#B63530",
          800: "#962C28",
          900: "#7C2624",
        },
        "rd-4": "rgba(240, 99, 92, 0.04)",
        "rd-8": "rgba(240, 99, 92, 0.08)",
        "rd-12": "rgba(240, 99, 92, 0.12)",
        "rd-20": "rgba(240, 99, 92, 0.20)",
        "rd-50": "rgba(240, 99, 92, 0.50)",

        // ──── Blue ── 부드러운 미디엄 블루 ────
        blue: {
          DEFAULT: "#5B8DEF",
          50: "#F3F6FE",
          100: "#E4EBFD",
          200: "#C9D8FB",
          300: "#A3BCF8",
          400: "#7DA0F4",
          500: "#5B8DEF",
          600: "#3D6FDB",
          700: "#3058B8",
          800: "#2B4A96",
          900: "#243D77",
        },
        "blue-4": "rgba(91, 141, 239, 0.04)",
        "blue-8": "rgba(91, 141, 239, 0.08)",
        "blue-12": "rgba(91, 141, 239, 0.12)",
        "blue-20": "rgba(91, 141, 239, 0.20)",
        "blue-50": "rgba(91, 141, 239, 0.50)",

        // ──── Green ────
        green: {
          DEFAULT: "#009E03",
          50: "#F0FFF0",
          100: "#DCFEDD",
          200: "#A8F5AA",
          300: "#6FE872",
          400: "#36D83A",
          500: "#009E03",
          600: "#008503",
          700: "#006B02",
          800: "#005202",
          900: "#003A01",
        },
        "green-4": "rgba(0, 158, 3, 0.04)",
        "green-8": "rgba(0, 158, 3, 0.08)",
        "green-12": "rgba(0, 158, 3, 0.12)",
        "green-20": "rgba(0, 158, 3, 0.20)",
        "green-50": "rgba(0, 158, 3, 0.50)",

        // ──── Yellow / Orange ────
        yellow: {
          DEFAULT: "#F57F17",
          50: "#FFFAF0",
          100: "#FFF0D4",
          200: "#FFDDA3",
          300: "#FFC46D",
          400: "#FFA838",
          500: "#F57F17",
          600: "#D06A10",
          700: "#AB560B",
          800: "#864307",
          900: "#613004",
        },
        "yellow-4": "rgba(245, 127, 23, 0.04)",
        "yellow-8": "rgba(245, 127, 23, 0.08)",
        "yellow-12": "rgba(245, 127, 23, 0.12)",
        "yellow-20": "rgba(245, 127, 23, 0.20)",
        "yellow-50": "rgba(245, 127, 23, 0.50)",

        // ──── Purple ────
        purple: {
          DEFAULT: "#7C3AED",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
        },
        "purple-8": "rgba(124, 58, 237, 0.08)",
        "purple-12": "rgba(124, 58, 237, 0.12)",
        "purple-20": "rgba(124, 58, 237, 0.20)",

        // ──── Pink ────
        pink: {
          DEFAULT: "#EC4899",
          50: "#FDF2F8",
          100: "#FCE7F3",
          200: "#FBCFE8",
          300: "#F9A8D4",
          400: "#F472B6",
          500: "#EC4899",
          600: "#DB2777",
          700: "#BE185D",
          800: "#9D174D",
          900: "#831843",
        },
        "pink-8": "rgba(236, 72, 153, 0.08)",
        "pink-12": "rgba(236, 72, 153, 0.12)",
        "pink-20": "rgba(236, 72, 153, 0.20)",

        // ──── Teal / Cyan ────
        teal: {
          DEFAULT: "#0D9488",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        "teal-8": "rgba(13, 148, 136, 0.08)",
        "teal-12": "rgba(13, 148, 136, 0.12)",
        "teal-20": "rgba(13, 148, 136, 0.20)",

        // ──── Indigo ────
        indigo: {
          DEFAULT: "#4F46E5",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        "indigo-8": "rgba(79, 70, 229, 0.08)",
        "indigo-12": "rgba(79, 70, 229, 0.12)",
        "indigo-20": "rgba(79, 70, 229, 0.20)",

        // ──── Lime ────
        lime: {
          DEFAULT: "#65A30D",
          50: "#F7FEE7",
          100: "#ECFCCB",
          200: "#D9F99D",
          300: "#BEF264",
          400: "#A3E635",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
          800: "#3F6212",
          900: "#365314",
        },
        "lime-8": "rgba(101, 163, 13, 0.08)",
        "lime-12": "rgba(101, 163, 13, 0.12)",

        // ──── Slate (extended neutrals) ────
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        // ──── Project neutrals ────
        sv: "#949494",
        "sv-50": "rgba(148, 148, 148, 0.50)",
        "sv-20": "rgba(148, 148, 148, 0.20)",
        bordercolor: "#E4E4E4",
        DG: "#3D3D3D",
        MG: "#6B6B6B",
        LG: "#EDEDED",
        BG: "#FAFAFA",
        shadow: "rgba(0, 0, 0, 0.02)",
        "shadow-sm": "rgba(0, 0, 0, 0.04)",
        "shadow-md": "rgba(0, 0, 0, 0.06)",
        "shadow-lg": "rgba(0, 0, 0, 0.10)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: [
          "28px",
          {
            lineHeight: "1.2",
            fontWeight: "800",
            letterSpacing: "-0.03em",
          },
        ],
        heading1: [
          "22px",
          {
            lineHeight: "1.3",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          },
        ],
        heading2: [
          "21px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
            letterSpacing: "-0.02em",
          },
        ],
        heading3: [
          "18px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
            letterSpacing: "-0.04em",
          },
        ],
        heading4: [
          "16px",
          {
            lineHeight: "1.3",
            fontWeight: "600",
            letterSpacing: "-0.02em",
          },
        ],
        bodylarge: [
          "16px",
          {
            lineHeight: "1.7",
            fontWeight: "400",
            letterSpacing: "-0.02em",
          },
        ],
        bodymedium: [
          "15px",
          {
            lineHeight: "1.6",
            fontWeight: "400",
            letterSpacing: "-0.02em",
            color: "#3D3D3D",
          },
        ],
        bodybtn: [
          "15px",
          {
            lineHeight: "1.3",
            fontWeight: "500",
            letterSpacing: "-0.02em",
          },
        ],
        caption2: [
          "14px",
          {
            lineHeight: "1.4",
            fontWeight: "400",
            letterSpacing: "-0.02em",
          },
        ],
        caption: [
          "13px",
          {
            lineHeight: "1.4",
            fontWeight: "400",
            letterSpacing: "-0.02em",
          },
        ],
        tiny: [
          "11px",
          {
            lineHeight: "1.4",
            fontWeight: "400",
            letterSpacing: "-0.01em",
          },
        ],
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

module.exports = config;
