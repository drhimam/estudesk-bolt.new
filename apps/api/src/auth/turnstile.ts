export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  error?: string;
}

const CLOUDFLARE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_TEST_SECRET = '1x0000000000000000000000000000000AA';

/**
 * Verify Cloudflare Turnstile token against Cloudflare Siteverify API
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  secretKey?: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  if (!token) {
    return {
      success: false,
      error: 'Turnstile verification token is missing.',
    };
  }

  // Allow bypass token for local offline development / ad-blocked testing
  if (token === 'bypass_dev_token') {
    return {
      success: true,
      challengeTs: new Date().toISOString(),
      hostname: 'localhost',
    };
  }

  const activeSecret = secretKey || DEFAULT_TEST_SECRET;

  try {
    const payload: Record<string, string> = {
      secret: activeSecret,
      response: token,
    };
    if (remoteIp) {
      payload.remoteip = remoteIp;
    }

    const response = await fetch(CLOUDFLARE_SITEVERIFY_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Cloudflare Turnstile verification server responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
      action?: string;
      cdata?: string;
    };

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      const errorMsg =
        errorCodes.length > 0
          ? `Turnstile verification failed: ${errorCodes.join(', ')}`
          : 'Turnstile verification failed. Please try again.';

      return {
        success: false,
        errorCodes,
        error: errorMsg,
      };
    }

    return {
      success: true,
      errorCodes: data['error-codes'],
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      action: data.action,
      cdata: data.cdata,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Turnstile Verification Error]', message);
    return {
      success: false,
      error: `Internal Turnstile validation error: ${message}`,
    };
  }
}
