import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export interface TurnstileWidgetHandle {
  reset: () => void;
  getResponse: () => string | undefined;
}

export interface TurnstileWidgetProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  action?: string;
  className?: string;
}

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Default Cloudflare Turnstile "Always Passes" Test Sitekey
const DEFAULT_TEST_SITEKEY = '1x00000000000000000000AA';

let scriptLoadingPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script element already exists in DOM
    const existingScript = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existingScript) {
      if (window.turnstile) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve();
      } else {
        // Turnstile API might need a tiny tick to attach to window
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 3000);
      }
    };
    script.onerror = (err) => {
      scriptLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  (
    {
      siteKey,
      onSuccess,
      onError,
      onExpire,
      theme = 'auto',
      size = 'normal',
      action = 'auth',
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const activeSiteKey =
      siteKey ||
      import.meta.env.VITE_TURNSTILE_SITE_KEY ||
      DEFAULT_TEST_SITEKEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
      getResponse: () => {
        if (widgetIdRef.current && window.turnstile) {
          return window.turnstile.getResponse(widgetIdRef.current);
        }
        return undefined;
      },
    }));

    useEffect(() => {
      let isMounted = true;

      loadTurnstileScript()
        .then(() => {
          if (!isMounted || !containerRef.current || !window.turnstile) return;

          // If widget was already rendered in this container, remove old one first
          if (widgetIdRef.current) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              // ignore cleanup errors
            }
            widgetIdRef.current = null;
          }

          try {
            const widgetId = window.turnstile.render(containerRef.current, {
              sitekey: activeSiteKey,
              theme,
              size,
              action,
              callback: (token: string) => {
                if (isMounted) {
                  onSuccess(token);
                }
              },
              'error-callback': (err: unknown) => {
                if (isMounted) {
                  onError?.(err);
                }
              },
              'expired-callback': () => {
                if (isMounted) {
                  onExpire?.();
                }
              },
            });

            widgetIdRef.current = widgetId;
            setIsLoaded(true);
          } catch (renderErr) {
            console.error('[Turnstile Render Error]', renderErr);
            if (isMounted) {
              setLoadError('Failed to initialize security verification.');
            }
          }
        })
        .catch((err) => {
          console.warn('[Turnstile Script Load Error]', err);
          if (isMounted) {
            setLoadError('Security challenge unavailable.');
            // Allow graceful fallback in offline or blocked environments
            onSuccess('bypass_dev_token');
          }
        });

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore cleanup errors
          }
          widgetIdRef.current = null;
        }
      };
    }, [activeSiteKey, theme, size, action, onSuccess, onError, onExpire]);

    return (
      <div className={`turnstile-wrapper flex flex-col items-center justify-center my-2 ${className}`}>
        <div
          ref={containerRef}
          className="min-h-[65px] flex items-center justify-center"
          data-testid="turnstile-container"
        />

        {!isLoaded && !loadError && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 text-xs text-ink-500 bg-paper-100/70 rounded-xl border border-paper-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
            <span>Connecting Cloudflare Turnstile...</span>
          </div>
        )}

        {loadError && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 py-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{loadError}</span>
          </div>
        )}
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
