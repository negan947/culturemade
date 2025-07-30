import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      height: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minHeight: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxHeight: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      aspectRatio: {
        iphone: "18 / 39",
      },
      fontFamily: {
        'sf-pro-display': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'sf-pro-text': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'sf-pro-rounded': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Rounded', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Premium Admin Color Palette - Charcoal + Deep Violet
        'admin': {
          // Dark Mode - Neutrals / Background Layers
          'bg-main': '#0F0F10',      // App background — ultra black
          'bg-surface': '#1A1A1C',   // Cards, modals, containers
          'bg-hover': '#232325',     // Hover/active state layers
          
          // Light Mode - Background Layers (adapted for light)
          'light-bg-main': '#F8F9FA',    // Light app background
          'light-bg-surface': '#FFFFFF', // Light cards, modals, containers
          'light-bg-hover': '#F1F3F4',   // Light hover/active state layers
          
          // Dark Mode - Borders / Outlines
          'border': '#2C2C2F',       // Standard card borders or outlines
          'border-soft': '#3A3A3E',  // Inner dividers, subtle separation
          
          // Light Mode - Borders / Outlines
          'light-border': '#E5E7EB',     // Light standard borders
          'light-border-soft': '#F3F4F6', // Light subtle separation
          
          // Dark Mode - Text Colors
          'text-primary': '#F5F5F7',   // High-priority text (not pure white)
          'text-secondary': '#B1B1B4', // Secondary supporting text
          'text-disabled': '#6F6F72',  // Disabled UI elements or placeholders
          
          // Light Mode - Text Colors
          'light-text-primary': '#111827',   // Dark text for light backgrounds
          'light-text-secondary': '#6B7280', // Secondary text for light mode
          'light-text-disabled': '#9CA3AF',  // Disabled text for light mode
          
          // Accent System (same for both modes, good contrast)
          'accent': '#7C3AED',         // Core brand violet — rich and energetic
          'accent-hover': '#8B5CF6',   // Hover/active state for buttons/links
          'accent-subtle': '#4C1D95',  // Muted violet for borders or low-emphasis UI
          
          // Light Mode - Accent Variations (softer for light backgrounds)
          'light-accent-bg': '#EDE9FE',    // Light accent background
          'light-accent-border': '#C4B5FD', // Light accent borders
          
          // Status Colors (same for both modes, excellent contrast)
          'success': '#34D399',        // Emerald Green — calm and reassuring
          'warning': '#FBBF24',        // Amber Gold — rich yellow with warmth
          'error': '#F43F5E',          // Crimson Rose — deep cherry/crimson
        },
        
        // Keep existing shadcn colors for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
      boxShadow: {
        'admin-soft': '0 1px 4px rgba(0, 0, 0, 0.35)',
        'admin-popover': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'admin-glow': '0 0 0 1px #7C3AED',
        'admin-glow-hover': '0 0 0 1px #8B5CF6',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
} satisfies Config

export default config

