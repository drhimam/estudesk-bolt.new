/**
 * Responsive, elegant email templates formatted in eStudesk's academic aesthetic.
 * Warm parchment header, crisp dark typography, emerald accent CTA buttons.
 */

export interface VerificationTemplateProps {
  userName: string;
  verificationUrl: string;
  supportEmail?: string;
}

export interface ResetPasswordTemplateProps {
  userName: string;
  resetUrl: string;
  expiresInMinutes?: number;
  supportEmail?: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subjectName?: string;
  subjectColor?: string;
  dueDate: Date | string;
  daysRemainingOrOverdue: number; // negative if overdue
}

export interface WeeklyDigestTemplateProps {
  userName: string;
  semesterName?: string;
  appUrl: string;
  overdue: DeadlineItem[];
  dueToday: DeadlineItem[];
  dueThisWeek: DeadlineItem[];
  later: DeadlineItem[];
}

export interface DeadlineAlertTemplateProps {
  userName: string;
  deadlineTitle: string;
  subjectName?: string;
  dueDate: Date | string;
  description?: string;
  actionUrl: string;
}

export interface TestEmailTemplateProps {
  userName: string;
  userEmail: string;
  timestamp: string;
  apiUrl: string;
}

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
  .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2dcd0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
  .header { background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 32px 36px; text-align: left; }
  .logo { font-family: Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.2); color: #e9ecef; font-size: 11px; text-transform: uppercase; margin-left: 8px; vertical-align: middle; }
  .subtitle { font-size: 13px; color: #d8f3dc; margin-top: 4px; }
  .content { padding: 36px; line-height: 1.6; }
  .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
  .btn { display: inline-block; padding: 12px 28px; background-color: #2d6a4f; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 24px 0 16px 0; text-align: center; }
  .btn:hover { background-color: #1b4332; }
  .callout { background-color: #fbf9f4; border-left: 4px solid #2d6a4f; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 13px; color: #334155; }
  .footer { background-color: #f7f3ec; padding: 24px 36px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2dcd0; }
  .link-muted { color: #52796f; text-decoration: underline; }
`;

/**
 * 1. Email Verification Template
 */
export function renderVerificationEmail(props: VerificationTemplateProps): { html: string; text: string } {
  const { userName, verificationUrl, supportEmail = 'support@estudesk.com' } = props;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email - eStudesk</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">eStudesk <span class="badge">Verification</span></div>
      <div class="subtitle">Academic Study Workspace & AI Companion</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || 'Scholar'},</div>
      <p>Thank you for signing up for <strong>eStudesk</strong>! Please verify your email address to secure your academic workspace and enable cloud sync across all your study devices.</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>

      <div class="callout">
        <strong>Security Tip:</strong> This verification link is valid for 24 hours. If you did not create an account on eStudesk, you can safely disregard this message.
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Button not working? Copy and paste this link into your browser:<br/>
        <a href="${verificationUrl}" class="link-muted" style="word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} eStudesk Inc. &bull; Academic Workspace & AI Study Desk<br/>
      Need help? Contact <a href="mailto:${supportEmail}" class="link-muted">${supportEmail}</a>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Hello ${userName || 'Scholar'},

Thank you for signing up for eStudesk! Please verify your email address by clicking the link below:

${verificationUrl}

This link is valid for 24 hours. If you did not create an account on eStudesk, you can safely disregard this message.

Need help? Contact ${supportEmail}
eStudesk Academic Workspace
`;

  return { html, text };
}

/**
 * 2. Password Reset Template
 */
export function renderResetPasswordEmail(props: ResetPasswordTemplateProps): { html: string; text: string } {
  const { userName, resetUrl, expiresInMinutes = 60, supportEmail = 'support@estudesk.com' } = props;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password - eStudesk</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">eStudesk <span class="badge">Security</span></div>
      <div class="subtitle">Password Recovery Request</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || 'Scholar'},</div>
      <p>We received a request to reset the password for your eStudesk account. Click the button below to choose a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <div class="callout">
        <strong>Expires in ${expiresInMinutes} minutes:</strong> For your protection, this password reset link will expire soon. If you did not request a password change, please ignore this email; your account remains secure.
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        If the button does not work, visit the URL directly:<br/>
        <a href="${resetUrl}" class="link-muted" style="word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} eStudesk Inc. &bull; Academic Workspace & AI Study Desk<br/>
      If you did not make this request, contact <a href="mailto:${supportEmail}" class="link-muted">${supportEmail}</a> immediately.
    </div>
  </div>
</body>
</html>
`;

  const text = `
Hello ${userName || 'Scholar'},

We received a request to reset your password on eStudesk.

Click the link below to set a new password (valid for ${expiresInMinutes} minutes):
${resetUrl}

If you did not request this, please disregard this email. Your current password remains secure.

eStudesk Academic Workspace
`;

  return { html, text };
}

/**
 * 3. Weekly Deadline Digest Template
 */
export function renderWeeklyDigestEmail(props: WeeklyDigestTemplateProps): { html: string; text: string } {
  const { userName, semesterName = 'Current Semester', appUrl, overdue, dueToday, dueThisWeek, later } = props;

  const totalCount = overdue.length + dueToday.length + dueThisWeek.length;

  function renderList(items: DeadlineItem[], color: string, badgeLabel: string) {
    if (items.length === 0) return '';
    return `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px; margin-bottom: 8px;">
          ${badgeLabel} (${items.length})
        </div>
        <div style="border: 1px solid #e2dcd0; border-radius: 10px; overflow: hidden; background: #ffffff;">
          ${items
            .map(
              (item, idx) => `
            <div style="padding: 10px 14px; border-bottom: ${idx < items.length - 1 ? '1px solid #f1ece1' : 'none'}; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-weight: 600; font-size: 13px; color: #1e293b;">${item.title}</span>
                ${item.subjectName ? `<span style="font-size: 11px; color: #64748b; margin-left: 6px;">&bull; ${item.subjectName}</span>` : ''}
              </div>
              <div style="font-size: 12px; font-weight: 600; color: ${color}; white-space: nowrap;">
                ${new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your week ahead on eStudesk</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">eStudesk <span class="badge">Weekly Digest</span></div>
      <div class="subtitle">Upcoming Deadlines & Schedule for ${semesterName}</div>
    </div>
    <div class="content">
      <div class="greeting">Good morning, ${userName || 'Scholar'}!</div>
      ${
        totalCount === 0
          ? `
      <p>Here is your weekly academic briefing for <strong>${semesterName}</strong>.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <div style="font-size: 16px; font-weight: 700; color: #166534; margin-bottom: 4px;">🎉 All Caught Up!</div>
        <div style="font-size: 13px; color: #15803d; line-height: 1.5;">You currently have zero pending deadlines or overdue assignments scheduled for this term.</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">Whenever you add assignments or exam dates in eStudesk, they will automatically be summarized and categorized in this weekly briefing.</p>
      `
          : `
      <p>Here is your weekly academic briefing. You have <strong>${totalCount} active items</strong> requiring your attention this week:</p>

      ${renderList(overdue, '#dc2626', '🔴 Overdue')}
      ${renderList(dueToday, '#ea580c', '🟠 Due Today')}
      ${renderList(dueThisWeek, '#d97706', '🟡 Due This Week')}
      ${renderList(later, '#475569', '⚪ Coming Up Later')}
      `
      }

      <div style="text-align: center; margin-top: 28px;">
        <a href="${appUrl}" class="btn" target="_blank">Open eStudesk Study Desk</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} eStudesk Inc. &bull; Academic Workspace & AI Study Desk<br/>
      You can customize your digest frequency in <a href="${appUrl}" class="link-muted">Settings &rarr; Notifications</a>.
    </div>
  </div>
</body>
</html>
`;

  const textLines: string[] = [
    `Good morning, ${userName || 'Scholar'}!`,
    `Here is your weekly deadline digest for ${semesterName}:`,
    '',
  ];

  if (overdue.length > 0) {
    textLines.push(`[OVERDUE] (${overdue.length})`);
    overdue.forEach((d) => textLines.push(` - ${d.title} (${d.subjectName || ''}) - Due: ${new Date(d.dueDate).toDateString()}`));
    textLines.push('');
  }
  if (dueToday.length > 0) {
    textLines.push(`[DUE TODAY] (${dueToday.length})`);
    dueToday.forEach((d) => textLines.push(` - ${d.title} (${d.subjectName || ''})`));
    textLines.push('');
  }
  if (dueThisWeek.length > 0) {
    textLines.push(`[THIS WEEK] (${dueThisWeek.length})`);
    dueThisWeek.forEach((d) => textLines.push(` - ${d.title} (${d.subjectName || ''}) - ${new Date(d.dueDate).toLocaleDateString()}`));
    textLines.push('');
  }

  textLines.push(`Open your desk: ${appUrl}`);
  const text = textLines.join('\n');

  return { html, text };
}

/**
 * 4. Deadline Alert Template (24h urgent)
 */
export function renderDeadlineAlertEmail(props: DeadlineAlertTemplateProps): { html: string; text: string } {
  const { userName, deadlineTitle, subjectName, dueDate, description, actionUrl } = props;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>⏰ Due Soon: ${deadlineTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">eStudesk <span class="badge" style="background:#ea580c;">Urgent Alert</span></div>
      <div class="subtitle">Upcoming Academic Deadline</div>
    </div>
    <div class="content">
      <div class="greeting">Hi ${userName || 'Scholar'},</div>
      <p>This is a reminder that you have a deadline coming up in 24 hours:</p>

      <div style="background: #fbf9f4; border: 1px solid #e2dcd0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${deadlineTitle}</div>
        ${subjectName ? `<div style="font-size: 12px; color: #2d6a4f; font-weight: 600; margin-top: 4px;">Subject: ${subjectName}</div>` : ''}
        <div style="font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 6px;">
          Due Date: ${new Date(dueDate).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        ${description ? `<div style="font-size: 12px; color: #64748b; margin-top: 8px; line-height: 1.5;">${description}</div>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${actionUrl}" class="btn" target="_blank">View in eStudesk</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} eStudesk Inc. &bull; Academic Workspace & AI Study Desk
    </div>
  </div>
</body>
</html>
`;

  const text = `
Hi ${userName || 'Scholar'},

Upcoming deadline reminder in 24 hours:
- Title: ${deadlineTitle}
- Subject: ${subjectName || 'General'}
- Due: ${new Date(dueDate).toLocaleString()}

View on eStudesk: ${actionUrl}
`;

  return { html, text };
}

/**
 * 5. Test Email Notification Template
 */
export function renderTestEmail(props: TestEmailTemplateProps): { html: string; text: string } {
  const { userName, userEmail, timestamp } = props;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>eStudesk Cloud Mail Connection Verified</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">eStudesk <span class="badge" style="background:#059669;">Connected</span></div>
      <div class="subtitle">eStudesk Secure Cloud Mail Service</div>
    </div>
    <div class="content">
      <div class="greeting">Success, ${userName || 'Scholar'}!</div>
      <p>Your eStudesk transactional email service is <strong>fully operational</strong>.</p>

      <div class="callout">
        <strong>Connection Details:</strong><br/>
        &bull; <strong>Recipient:</strong> ${userEmail}<br/>
        &bull; <strong>Service Status:</strong> Active &amp; Verified<br/>
        &bull; <strong>Dispatch Time:</strong> ${timestamp}<br/>
        &bull; <strong>Status:</strong> Authenticated &amp; Delivered
      </div>

      <p>You will receive timely email verification links, password recovery instructions, and your personalized weekly deadline digests directly from this mailbox.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} eStudesk Inc. &bull; Enterprise Academic Infrastructure
    </div>
  </div>
</body>
</html>
`;

  const text = `
Success, ${userName || 'Scholar'}!

Your eStudesk transactional email connection is functioning properly.
- Recipient: ${userEmail}
- Service: eStudesk Cloud Mail
- Timestamp: ${timestamp}

eStudesk Academic Workspace
`;

  return { html, text };
}
