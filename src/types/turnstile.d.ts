export interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error?: unknown) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  tabindex?: number;
  action?: string;
  cData?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
}

export interface TurnstileObject {
  render: (
    container: string | HTMLElement,
    options: TurnstileRenderOptions
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
  execute: (container?: string | HTMLElement, options?: TurnstileRenderOptions) => void;
  ready: (callback: () => void) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileObject;
    onTurnstileLoaded?: () => void;
  }
}
