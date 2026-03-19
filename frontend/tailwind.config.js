/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f4f6fb",
        panel: "#ffffff",
        ink: "#111827",
        muted: "#6b7280",
        borderSoft: "#dbe1ee",
        navy: "#0c1735",
        accent: "#ff6a3d"
      },
      boxShadow: {
        panel: "0 12px 34px -24px rgba(17, 24, 39, 0.42)",
      },
      borderRadius: {
        xxl: "1.25rem",
      },
    },
  },
  plugins: [],
};
