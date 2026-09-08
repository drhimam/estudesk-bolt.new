/**
 * Web Reader Utility
 * Fetches and extracts clean markdown/text content from public web pages.
 */

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/**
 * Extract all HTTP/HTTPS URLs found in a text string.
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  // Deduplicate and filter valid URLs
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;:!?)]+$/, ''))));
}

/**
 * Clean and strip HTML tags if raw HTML is returned.
 */
function cleanHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Remove scripts, styles, nav, footer, iframes
    const junk = doc.querySelectorAll('script, style, noscript, nav, footer, header, svg, iframe');
    junk.forEach((el) => el.remove());
    return (doc.body.textContent || '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Fetch and extract readable content from a given URL.
 */
export async function fetchUrlContent(
  url: string,
  timeoutMs = 12000,
): Promise<{ title?: string; text: string; url: string }> {
  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Strategy 1: Jina Reader (Clean Markdown with full CORS support)
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain',
        'X-No-Cache': 'true',
      },
    });

    if (res.ok) {
      clearTimeout(timeoutId);
      const text = await res.text();
      if (text && text.trim().length > 50) {
        // Extract Title if present at beginning
        const titleMatch = text.match(/^Title:\s*(.+)$/m);
        return {
          title: titleMatch ? titleMatch[1].trim() : undefined,
          text: text.slice(0, 15000).trim(), // Cap to safe context length
          url: targetUrl,
        };
      }
    }
  } catch (err) {
    console.warn(`[webReader] Jina reader failed for ${targetUrl}:`, err);
  }

  // Strategy 2: AllOrigins proxy fallback
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const rawText = await res.text();
      const cleaned = cleanHtml(rawText);
      if (cleaned.length > 50) {
        return {
          text: cleaned.slice(0, 15000),
          url: targetUrl,
        };
      }
    }
  } catch (err) {
    console.warn(`[webReader] AllOrigins proxy failed for ${targetUrl}:`, err);
  } finally {
    clearTimeout(timeoutId);
  }

  throw new Error(`Could not retrieve content from ${targetUrl}. Please ensure the URL is publicly accessible or copy-paste the text directly.`);
}
