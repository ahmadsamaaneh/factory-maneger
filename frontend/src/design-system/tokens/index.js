export { colors, semanticColors } from './colors';
export { typography, textStyles } from './typography';

export const spacing = {
  0: '0',     0.5: '0.125rem', 1: '0.25rem',  1.5: '0.375rem',
  2: '0.5rem',2.5: '0.625rem', 3: '0.75rem',  4: '1rem',
  5: '1.25rem',6: '1.5rem',   8: '2rem',      10: '2.5rem',
  12: '3rem', 16: '4rem',     20: '5rem',     24: '6rem',
};

export const radii = {
  none: '0',    sm: '0.25rem', md: '0.5rem',
  lg: '0.75rem',xl: '1rem',   '2xl': '1.5rem', full: '9999px',
};

export const shadows = {
  xs:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm:  '0 1px 3px 0 rgb(0 0 0 / 0.08)',
  md:  '0 4px 6px -1px rgb(0 0 0 / 0.08)',
  lg:  '0 10px 15px -3px rgb(0 0 0 / 0.08)',
  xl:  '0 20px 25px -5px rgb(0 0 0 / 0.10)',
  '2xl':'0 25px 50px -12px rgb(0 0 0 / 0.18)',
};

export const zIndex = {
  base: 0, dropdown: 10, sticky: 20, overlay: 30, modal: 40, popover: 50, tooltip: 60,
};

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
};

export const duration = { fast: '100ms', normal: '200ms', slow: '300ms', slower: '500ms' };
export const easing   = { default: 'cubic-bezier(0.4,0,0.2,1)', spring: 'cubic-bezier(0.175,0.885,0.32,1.275)' };
