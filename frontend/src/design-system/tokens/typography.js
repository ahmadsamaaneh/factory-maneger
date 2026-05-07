export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    '2xs': '0.625rem',
    xs:    '0.75rem',
    sm:    '0.875rem',
    base:  '1rem',
    lg:    '1.125rem',
    xl:    '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  lineHeight: {
    none:    1,
    tight:   1.25,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
    loose:   2,
  },
  fontWeight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  letterSpacing: {
    tight:  '-0.025em',
    normal: '0',
    wide:   '0.025em',
    wider:  '0.05em',
    widest: '0.1em',
  },
};

export const textStyles = {
  h1:      { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.025em' },
  h2:      { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3,  letterSpacing: '-0.02em'  },
  h3:      { fontSize: '1.5rem',   fontWeight: 600, lineHeight: 1.375 },
  h4:      { fontSize: '1.25rem',  fontWeight: 600, lineHeight: 1.4   },
  h5:      { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5   },
  h6:      { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' },
  bodyLg:  { fontSize: '1rem',     fontWeight: 400, lineHeight: 1.625 },
  body:    { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5   },
  bodySm:  { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.5   },
  label:   { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.25  },
  caption: { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.5,  color: 'var(--text-tertiary)' },
  code:    { fontSize: '0.8125rem', fontFamily: 'mono', fontWeight: 400 },
};
