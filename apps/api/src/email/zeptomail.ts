export interface ZeptoMailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromEmail?: string;
  fromName?: string;
  apiKey?: string;
  apiUrl?: string;
}

export interface ZeptoMailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: unknown;
}

/**
 * Sends transactional email using Zoho ZeptoMail Canada (api.zeptomail.ca)
 * Defaults to Zoho Canada region REST endpoint.
 */
export async function sendZeptoMail(options: ZeptoMailOptions): Promise<ZeptoMailResponse> {
  const {
    toEmail,
    toName,
    subject,
    htmlBody,
    textBody,
    fromEmail = 'noreply@estudesk.com',
    fromName = 'eStudesk',
    apiKey,
    apiUrl = 'https://api.zeptomail.ca/v1.1/email',
  } = options;

  if (!toEmail) {
    return { success: false, error: 'Recipient email is required.' };
  }

  // If no API key configured in dev/testing, simulate dispatch with logging
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    console.log(`[ZeptoMail Canada Mock] To: ${toEmail} | Subject: "${subject}"`);
    return {
      success: true,
      messageId: `mock_zeptomail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      data: { simulated: true, recipient: toEmail, subject },
    };
  }

  // Ensure Zoho token prefix format
  const authHeader = apiKey.startsWith('Zoho-enczapikey ')
    ? apiKey
    : `Zoho-enczapikey ${apiKey.trim()}`;

  const payload = {
    from: {
      address: fromEmail,
      name: fromName,
    },
    to: [
      {
        email_address: {
          address: toEmail.trim(),
          name: toName || toEmail.split('@')[0],
        },
      },
    ],
    subject: subject,
    htmlbody: htmlBody,
    textbody: textBody || htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const resJson = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const errorMsg =
        (resJson?.error as { message?: string })?.message ||
        (resJson?.message as string) ||
        `ZeptoMail API responded with status ${response.status}`;
      console.error(`[ZeptoMail Error] ${response.status}:`, resJson);
      return { success: false, error: errorMsg, data: resJson };
    }

    // Extract message ID from ZeptoMail response format: data[0].request_id / message_id
    const responseData = (resJson?.data as Array<Record<string, unknown>>) || [];
    const messageId =
      (responseData[0]?.message_id as string) ||
      (responseData[0]?.request_id as string) ||
      (resJson?.request_id as string) ||
      `zepto_${Date.now()}`;

    return {
      success: true,
      messageId,
      data: resJson,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ZeptoMail Network Exception]', errorMsg);
    return { success: false, error: errorMsg };
  }
}
