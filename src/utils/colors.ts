import type { SubjectColor } from '@/types';

export const SUBJECT_COLORS: SubjectColor[] = [
  'rose',
  'amber',
  'teal',
  'blue',
  'violet',
  'emerald',
  'crimson',
  'slate',
  'plum',
  'ochre',
];

export const COLOR_HEX: Record<SubjectColor, string> = {
  rose: '#c2546d',
  amber: '#c08a3e',
  teal: '#3d8a7e',
  blue: '#4a7ab5',
  violet: '#7a64b0',
  emerald: '#4a9a5e',
  crimson: '#b04545',
  slate: '#5a6a80',
  plum: '#8a5a7a',
  ochre: '#a07840',
};

export const COLOR_LIGHT: Record<SubjectColor, string> = {
  rose: '#f9eef0',
  amber: '#f9f2e4',
  teal: '#e8f3f0',
  blue: '#eaf1f8',
  violet: '#f0ebf6',
  emerald: '#eaf3ed',
  crimson: '#f8ebeb',
  slate: '#eef0f3',
  plum: '#f4eef1',
  ochre: '#f4eee2',
};

export const COLOR_TEXT: Record<SubjectColor, string> = {
  rose: '#9c3e54',
  amber: '#9a6e2e',
  teal: '#2e6e64',
  blue: '#3a618f',
  violet: '#5e4a8e',
  emerald: '#3a7a4a',
  crimson: '#8e3535',
  slate: '#44545f',
  plum: '#6e445e',
  ochre: '#7e5e30',
};

export function colorDot(color: SubjectColor): string {
  return COLOR_HEX[color];
}

export function colorBg(color: SubjectColor): string {
  return COLOR_LIGHT[color];
}

export function colorText(color: SubjectColor): string {
  return COLOR_TEXT[color];
}
