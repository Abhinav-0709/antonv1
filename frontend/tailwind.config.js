/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        linear: {
          bg: "#F7F8F9",
          card: "#FFFFFF",
          cardHover: "#F3F4F6",
          inner: "#F0F2F5",
          border: "#E2E4E8",
          borderHover: "#CBD0D6",
          textPrimary: "#111827",
          textMuted: "#64748B",
          textDim: "#94A3B8",
        },
        vercel: {
          black: "#000000",
          card: "#0a0a0a",
          cardHover: "#111111",
          inner: "#111111",
          border: "#1f1f1f",
          borderHover: "#333333",
          borderLight: "#2a2a2a",
          blue: "#0070f3",
          blueHover: "#3291ff",
          blueLight: "#60a5fa",
          blueDim: "rgba(0, 112, 243, 0.1)",
          textWhite: "#ffffff",
          textMuted: "#888888",
          textDim: "#666666",
          green: "#00c48c",
          red: "#ee0000",
          amber: "#f5a623",
        },
      },
    },
  },
  plugins: [],
};
