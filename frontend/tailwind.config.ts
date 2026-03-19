import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f5f7fb",
        ink: "#0f172a",
        mutedInk: "#64748b",
        borderSoft: "#d7deeb",
        brandDark: "#111827",
      },
      boxShadow: {
        card: "0 20px 50px -30px rgba(15, 23, 42, 0.45)",
        panel: "0 12px 35px -24px rgba(15, 23, 42, 0.35)",
      },
      borderRadius: {
        xxl: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
