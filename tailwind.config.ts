import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10231c",
        mint: "#e8f5ee",
        forest: "#164b35",
        coral: "#ff795f",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(16, 35, 28, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
