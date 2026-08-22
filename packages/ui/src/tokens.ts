/**
 * Atlas & Ink Design Tokens
 * Source of Truth: GlobeTrotter Production UI/UX & Motion System
 */

export const colors = {
  ink: {
    950: "#0E1420", // App background (dark default)
    900: "#141C2C", // Surface / card background
    800: "#1E2A3F", // Elevated surface / hover surface
  },
  parchment: {
    50: "#F6F1E4", // Light background, text-on-dark warm tint
  },
  brass: {
    500: "#C9973F", // Primary accent (buttons, links, active tab, route thread)
    400: "#DDB35F", // Primary hover / lighter accent
  },
  coral: {
    500: "#E8674A", // Destructive / overbudget / live badge
  },
  sage: {
    500: "#7FA687", // Success / completed badge / saved confirmation
  },
  slate: {
    300: "#B7C0CE", // Secondary text on dark
    500: "#7C8798", // Placeholder / disabled text
  },
} as const;

export const motionTokens = {
  easeStandard: "cubic-bezier(0.16, 1, 0.3, 1)",
  durationInstant: 0.1, // 100ms
  durationFast: 0.16,   // 160ms
  durationBase: 0.24,   // 240ms
  durationSlow: 0.42,   // 420ms
  durationPage: 0.52,   // 520ms
} as const;

export const spacingScale = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const radiusScale = {
  sm: "8px",   // inputs, chips
  md: "14px",  // cards
  lg: "24px",  // modals, hero banner
} as const;
