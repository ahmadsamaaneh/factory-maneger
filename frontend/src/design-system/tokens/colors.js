export const colors = {
  primary: { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 800:'#3730a3', 900:'#312e81', 950:'#1e1b4b' },
  success: { 50:'#f0fdf4', 100:'#dcfce7', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 900:'#14532d' },
  warning: { 50:'#fffbeb', 100:'#fef3c7', 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706', 700:'#b45309', 900:'#78350f' },
  danger:  { 50:'#fef2f2', 100:'#fee2e2', 400:'#f87171', 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c', 900:'#7f1d1d' },
  info:    { 50:'#eff6ff', 100:'#dbeafe', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8', 900:'#1e3a8a' },
  neutral: { 0:'#ffffff', 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a', 950:'#020617' },
};

export const semanticColors = {
  light: {
    bgApp:          colors.neutral[50],
    bgSurface:      colors.neutral[0],
    bgSubtle:       colors.neutral[100],
    bgMuted:        colors.neutral[200],
    textPrimary:    colors.neutral[900],
    textSecondary:  colors.neutral[600],
    textTertiary:   colors.neutral[400],
    textDisabled:   colors.neutral[300],
    borderDefault:  colors.neutral[200],
    borderStrong:   colors.neutral[300],
    borderFocus:    colors.primary[500],
  },
  dark: {
    bgApp:          colors.neutral[900],
    bgSurface:      colors.neutral[800],
    bgSubtle:       colors.neutral[700],
    bgMuted:        colors.neutral[600],
    textPrimary:    colors.neutral[100],
    textSecondary:  colors.neutral[400],
    textTertiary:   colors.neutral[500],
    textDisabled:   colors.neutral[600],
    borderDefault:  colors.neutral[700],
    borderStrong:   colors.neutral[600],
    borderFocus:    colors.primary[400],
  },
};
