/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary color palette
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
        },
        // Secondary colors
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          dark: "rgb(var(--color-secondary-dark) / <alpha-value>)",
          light: "rgb(var(--color-secondary-light) / <alpha-value>)",
        },
        // Accent colors
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          dark: "rgb(var(--color-accent-dark) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / <alpha-value>)",
        },
        // Background colors
        background: {
          DEFAULT: "rgb(var(--color-background) / <alpha-value>)",
          dark: "rgb(var(--color-background-dark) / <alpha-value>)",
          secondary: "rgb(var(--color-background-secondary) / <alpha-value>)",
          "secondary-dark":
            "rgb(var(--color-background-secondary-dark) / <alpha-value>)",
        },
        // Legacy bg colors for backward compatibility
        bg: {
          light: "rgb(var(--color-background) / <alpha-value>)",
          dark: "rgb(var(--color-background-dark) / <alpha-value>)",
        },
        // Surface colors
        surface: {
          light: "rgb(var(--color-surface) / <alpha-value>)",
          dark: "rgb(var(--color-surface-dark) / <alpha-value>)",
        },
        // Text colors
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          "primary-dark": "rgb(var(--color-text-primary-dark) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          "secondary-dark":
            "rgb(var(--color-text-secondary-dark) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
          "muted-dark": "rgb(var(--color-text-muted-dark) / <alpha-value>)",
        },
        // Border colors
        border: {
          light: "rgb(var(--color-border) / <alpha-value>)",
          dark: "rgb(var(--color-border-dark) / <alpha-value>)",
        },
        // Status colors
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        // Legacy muted colors for backward compatibility
        muted: {
          light: "rgb(var(--color-text-muted) / <alpha-value>)",
          dark: "rgb(var(--color-text-muted-dark) / <alpha-value>)",
        },
      },
      boxShadow: {
        theme:
          "0 4px 6px -1px rgb(var(--color-shadow) / var(--color-shadow-opacity)), 0 2px 4px -2px rgb(var(--color-shadow) / var(--color-shadow-opacity))",
      },
    },
  },
  plugins: [],
}
