// Auto-generated design tokens - DO NOT EDIT
// Edit tokens/tokens.json and run: npm run tokens:build

export const tokens = {
  "color": {
    "primary": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "300": "#cbd5e1",
      "400": "#94a3b8",
      "500": "#64748b",
      "600": "#475569",
      "700": "#334155",
      "800": "#1e293b",
      "900": "#0f172a",
      "950": "#020617"
    },
    "soccer": {
      "grass": "#22c55e",
      "pitch": "#15803d",
      "goal": "#3b82f6",
      "card": "#ef4444",
      "referee": "#f59e0b"
    },
    "status": {
      "pending": "#f59e0b",
      "processing": "#3b82f6",
      "completed": "#22c55e",
      "failed": "#ef4444"
    },
    "background": {
      "default": "#ffffff",
      "muted": "#f8fafc",
      "subtle": "#f1f5f9"
    },
    "border": "#e2e8f0",
    "text": {
      "primary": "#0f172a",
      "secondary": "#475569",
      "muted": "#64748b"
    }
  },
  "spacing": {
    "0": "0rem",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  },
  "radius": {
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "2xl": "1.5rem",
    "full": "9999px"
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  }
} as const;

/**
 * Get token value by dot notation
 * Example: getToken('color.soccer.grass') → '#22c55e'
 */
export function getToken(path: string): string {
  const parts = path.split('.');
  let current: any = tokens;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      console.warn(`Token not found: ${path}`);
      return '';
    }
    current = current[part];
  }
  
  return typeof current === 'string' ? current : '';
}

/**
 * Prediction status colors from tokens
 */
export const statusColors = {
  pending: tokens.color.status.pending,
  processing: tokens.color.status.processing,
  completed: tokens.color.status.completed,
  failed: tokens.color.status.failed,
} as const;

/**
 * Soccer theme colors
 */
export const soccerColors = {
  grass: tokens.color.soccer.grass,
  pitch: tokens.color.soccer.pitch,
  goal: tokens.color.soccer.goal,
  card: tokens.color.soccer.card,
  referee: tokens.color.soccer.referee,
} as const;
