/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Primary (Indigo) ─────────────────────────────── */
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /* ── Success (Green) ─────────────────────────────── */
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        /* ── Warning (Amber) ─────────────────────────────── */
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },
        /* ── Danger (Red) ────────────────────────────────── */
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        /* ── Info (Blue) ─────────────────────────────────── */
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        /* ── Neutral (Slate) ─────────────────────────────── */
        neutral: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        /* ── Surface tokens (semantic) ───────────────────── */
        surface: {
          DEFAULT: '#ffffff',
          subtle:  '#f8fafc',
          muted:   '#f1f5f9',
          overlay: 'rgba(15,23,42,0.4)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem'     }],
        sm:    ['0.875rem', { lineHeight: '1.25rem'  }],
        base:  ['1rem',     { lineHeight: '1.5rem'   }],
        lg:    ['1.125rem', { lineHeight: '1.75rem'  }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem'  }],
        '2xl': ['1.5rem',   { lineHeight: '2rem'     }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem'  }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem'   }],
      },

      fontWeight: {
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
      },

      borderRadius: {
        none: '0',
        sm:   '0.25rem',
        DEFAULT: '0.375rem',
        md:   '0.5rem',
        lg:   '0.75rem',
        xl:   '1rem',
        '2xl':'1.5rem',
        full: '9999px',
      },

      boxShadow: {
        xs:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm:  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        lg:  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        xl:  '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
        '2xl':'0 25px 50px -12px rgb(0 0 0 / 0.18)',
        inner:'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none',
      },

      spacing: {
        px:    '1px',
        0:     '0',
        0.5:   '0.125rem',  /* 2px  */
        1:     '0.25rem',   /* 4px  */
        1.5:   '0.375rem',  /* 6px  */
        2:     '0.5rem',    /* 8px  */
        2.5:   '0.625rem',  /* 10px */
        3:     '0.75rem',   /* 12px */
        3.5:   '0.875rem',  /* 14px */
        4:     '1rem',      /* 16px */
        5:     '1.25rem',   /* 20px */
        6:     '1.5rem',    /* 24px */
        7:     '1.75rem',   /* 28px */
        8:     '2rem',      /* 32px */
        9:     '2.25rem',   /* 36px */
        10:    '2.5rem',    /* 40px */
        11:    '2.75rem',   /* 44px */
        12:    '3rem',      /* 48px */
        14:    '3.5rem',    /* 56px */
        16:    '4rem',      /* 64px */
        20:    '5rem',      /* 80px */
        24:    '6rem',      /* 96px */
        28:    '7rem',
        32:    '8rem',
        36:    '9rem',
        40:    '10rem',
        48:    '12rem',
        56:    '14rem',
        60:    '15rem',
        64:    '16rem',
        72:    '18rem',
        80:    '20rem',
        96:    '24rem',
      },

      transitionDuration: {
        75:  '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in:      'cubic-bezier(0.4, 0, 1, 1)',
        out:     'cubic-bezier(0, 0, 0.2, 1)',
        spring:  'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      keyframes: {
        'fade-in':     { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out':    { from: { opacity: 1 }, to: { opacity: 0 } },
        'slide-up':    { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-down':  { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-right': { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        'scale-in':    { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'spin':        { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'pulse':       { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        'shimmer':     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },

      animation: {
        'fade-in':    'fade-in 150ms ease-out',
        'fade-out':   'fade-out 150ms ease-in',
        'slide-up':   'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'slide-right':'slide-right 250ms ease-out',
        'scale-in':   'scale-in 150ms ease-out',
        'spin':       'spin 700ms linear infinite',
        'pulse':      'pulse 1.5s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
