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
  description?: string | null;
  subjectName?: string | null;
  subjectColor?: string | null;
  dueDate: Date | string | number;
  daysRemainingOrOverdue?: number; // negative if overdue
}

export interface EmailDeadlineGroup {
  id: string;
  label: string;
  sublabel?: string;
  category: 'overdue' | 'today' | 'thisWeek' | 'nextWeek' | 'later';
  dotColor: string;
  headerColor: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  items: DeadlineItem[];
}

export interface WeeklyDigestTemplateProps {
  userName: string;
  semesterName?: string;
  appUrl: string;
  deadlines?: DeadlineItem[];
  overdue?: DeadlineItem[];
  dueToday?: DeadlineItem[];
  dueThisWeek?: DeadlineItem[];
  later?: DeadlineItem[];
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

const DAY_MS = 1000 * 60 * 60 * 24;

const SUBJECT_COLOR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  rose: { bg: '#f9eef0', text: '#9c3e54', border: '#f3d6dc' },
  amber: { bg: '#f9f2e4', text: '#9a6e2e', border: '#fae8c8' },
  teal: { bg: '#e8f3f0', text: '#2e6e64', border: '#cce6e0' },
  blue: { bg: '#eaf1f8', text: '#3a618f', border: '#d0e0f0' },
  violet: { bg: '#f0ebf6', text: '#5e4a8e', border: '#dfd4ed' },
  emerald: { bg: '#eaf3ed', text: '#3a7a4a', border: '#d2e8d7' },
  crimson: { bg: '#f8ebeb', text: '#8e3535', border: '#f2d2d2' },
  slate: { bg: '#eef0f3', text: '#44545f', border: '#d9dee4' },
  plum: { bg: '#f4eef1', text: '#6e445e', border: '#e8dae2' },
  ochre: { bg: '#f4eee2', text: '#7e5e30', border: '#ebdcc5' },
};

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function startOfDay(ts: number | Date): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const startYear = startDate.getFullYear();

  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const endYear = endDate.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endDay}`;
}

function formatItemDueDate(dueDate: Date | string | number): string {
  const d = new Date(dueDate);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function daysUntil(dueDate: Date | string | number, nowTs: number): number {
  const due = startOfDay(dueDate);
  return Math.round((due - nowTs) / DAY_MS);
}

function getRelativeStatusLabel(dueDate: Date | string | number, nowTs: number): string {
  const days = daysUntil(dueDate, nowTs);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}

export function groupDeadlinesForEmail(items: DeadlineItem[], referenceDate = new Date()): EmailDeadlineGroup[] {
  const sorted = [...items].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  if (sorted.length === 0) return [];

  const now = startOfDay(referenceDate.getTime());
  const dayOfWeek = new Date(now).getDay(); // 0 is Sunday, 1 is Monday ...
  const mondayOffset = (dayOfWeek + 6) % 7; // Monday = 0, Sunday = 6

  const currentWeekStart = now - mondayOffset * DAY_MS;
  const currentWeekEnd = currentWeekStart + 7 * DAY_MS - 1;

  const nextWeekStart = currentWeekStart + 7 * DAY_MS;
  const nextWeekEnd = nextWeekStart + 7 * DAY_MS - 1;

  const overdueItems: DeadlineItem[] = [];
  const todayItems: DeadlineItem[] = [];
  const thisWeekItems: DeadlineItem[] = [];
  const nextWeekItems: DeadlineItem[] = [];
  const futureWeeksMap = new Map<number, { start: Date; end: Date; items: DeadlineItem[] }>();

  for (const item of sorted) {
    const due = startOfDay(new Date(item.dueDate).getTime());

    if (due < now) {
      overdueItems.push(item);
    } else if (due === now) {
      todayItems.push(item);
    } else if (due <= currentWeekEnd) {
      thisWeekItems.push(item);
    } else if (due <= nextWeekEnd) {
      nextWeekItems.push(item);
    } else {
      const dDayOfWeek = new Date(due).getDay();
      const dOffset = (dDayOfWeek + 6) % 7;
      const weekStartTs = due - dOffset * DAY_MS;
      const weekEndTs = weekStartTs + 7 * DAY_MS - 1;

      if (!futureWeeksMap.has(weekStartTs)) {
        futureWeeksMap.set(weekStartTs, {
          start: new Date(weekStartTs),
          end: new Date(weekEndTs),
          items: [],
        });
      }
      futureWeeksMap.get(weekStartTs)!.items.push(item);
    }
  }

  const groups: EmailDeadlineGroup[] = [];

  if (overdueItems.length > 0) {
    groups.push({
      id: 'overdue',
      label: 'Overdue',
      category: 'overdue',
      dotColor: '#e11d48',
      headerColor: '#9f1239',
      cardBg: '#fff1f2',
      cardBorder: '#fecdd3',
      badgeBg: '#ffe4e6',
      badgeText: '#9f1239',
      items: overdueItems,
    });
  }

  if (todayItems.length > 0) {
    groups.push({
      id: 'today',
      label: 'Today',
      category: 'today',
      dotColor: '#d97706',
      headerColor: '#92400e',
      cardBg: '#fffbeb',
      cardBorder: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      items: todayItems,
    });
  }

  if (thisWeekItems.length > 0) {
    groups.push({
      id: 'thisWeek',
      label: 'This Week',
      sublabel: formatWeekRange(new Date(now + DAY_MS), new Date(currentWeekEnd)),
      category: 'thisWeek',
      dotColor: '#0284c7',
      headerColor: '#075985',
      cardBg: '#f0f9ff',
      cardBorder: '#bae6fd',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
      items: thisWeekItems,
    });
  }

  if (nextWeekItems.length > 0) {
    groups.push({
      id: 'nextWeek',
      label: 'Next Week',
      sublabel: formatWeekRange(new Date(nextWeekStart), new Date(nextWeekEnd)),
      category: 'nextWeek',
      dotColor: '#4f46e5',
      headerColor: '#3730a3',
      cardBg: '#eef2ff',
      cardBorder: '#c7d2fe',
      badgeBg: '#e0e7ff',
      badgeText: '#3730a3',
      items: nextWeekItems,
    });
  }

  const sortedWeekTimestamps = Array.from(futureWeeksMap.keys()).sort((a, b) => a - b);
  for (const weekTs of sortedWeekTimestamps) {
    const weekData = futureWeeksMap.get(weekTs)!;
    const rangeStr = formatWeekRange(weekData.start, weekData.end);
    groups.push({
      id: `week-${weekTs}`,
      label: `Week of ${rangeStr}`,
      category: 'later',
      dotColor: '#4a8a64',
      headerColor: '#274835',
      cardBg: '#f4f8f5',
      cardBorder: '#d3e4d9',
      badgeBg: '#e3eee6',
      badgeText: '#274835',
      items: weekData.items,
    });
  }

  return groups;
}

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
  .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2dcd0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
  .header { background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 32px 36px; text-align: left; }
  .logo { font-family: Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.2); color: #e9ecef; font-size: 11px; text-transform: uppercase; margin-left: 8px; vertical-align: middle; }
  .subtitle { font-size: 13px; color: #d8f3dc; margin-top: 4px; }
  .content { padding: 32px 36px; line-height: 1.6; }
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
      <div class="greeting">Hello ${escapeHtml(userName) || 'Scholar'},</div>
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
      <div class="greeting">Hello ${escapeHtml(userName) || 'Scholar'},</div>
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
 * 3. Weekly Deadline Digest Template (Week-by-Week Date-Wise Table Layout)
 */
export function renderWeeklyDigestEmail(props: WeeklyDigestTemplateProps): {
  html: string;
  text: string;
  totalCount: number;
  thisWeekCount: number;
  urgentCount: number;
} {
  const { userName, semesterName = 'Current Semester', appUrl } = props;

  // Gather all items from either props.deadlines or legacy arrays
  const allItems: DeadlineItem[] = props.deadlines
    ? [...props.deadlines]
    : [
        ...(props.overdue || []),
        ...(props.dueToday || []),
        ...(props.dueThisWeek || []),
        ...(props.later || []),
      ];

  const nowTs = startOfDay(Date.now());
  const groups = groupDeadlinesForEmail(allItems);

  const totalCount = allItems.length;
  const overdueCount = groups.find((g) => g.id === 'overdue')?.items.length || 0;
  const todayCount = groups.find((g) => g.id === 'today')?.items.length || 0;
  const thisWeekCount = groups.find((g) => g.id === 'thisWeek')?.items.length || 0;
  const urgentCount = overdueCount + todayCount;

  function renderGroupHtml(group: EmailDeadlineGroup): string {
    if (group.items.length === 0) return '';

    const itemsHtml = group.items
      .map((item) => {
        const subColorKey = (item.subjectColor || '').toLowerCase();
        const subStyle =
          SUBJECT_COLOR_STYLES[subColorKey] || {
            bg: '#f1ece1',
            text: '#5c5243',
            border: '#e2dcd0',
          };
        const subjectName = item.subjectName || 'Other';
        const subjectBadge = `
          <span style="display: inline-block; margin-left: 6px; padding: 2px 7px; border-radius: 10px; background-color: ${subStyle.bg}; color: ${subStyle.text}; border: 1px solid ${subStyle.border}; font-size: 10px; font-weight: 600; vertical-align: middle;">
            ${escapeHtml(subjectName)}
          </span>
        `;

        const dueDateFormatted = formatItemDueDate(item.dueDate);
        const statusLabel = getRelativeStatusLabel(item.dueDate, nowTs);

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px; background-color: ${group.cardBg}; border: 1px solid ${group.cardBorder}; border-radius: 12px; border-collapse: separate;">
            <tr>
              <td style="padding: 12px 14px; vertical-align: middle;">
                <div style="margin-bottom: 3px;">
                  <span style="font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.3;">${escapeHtml(item.title)}</span>
                  ${subjectBadge}
                </div>
                <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
                  <span style="font-weight: 500; color: #475569;">Due ${dueDateFormatted}</span>
                  ${
                    item.description
                      ? `<span style="color: #cbd5e1; margin: 0 4px;">&bull;</span><span style="color: #64748b;">${escapeHtml(item.description)}</span>`
                      : ''
                  }
                </div>
              </td>
              <td align="right" style="padding: 12px 14px; vertical-align: middle; white-space: nowrap; width: 1%;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: ${group.badgeBg}; color: ${group.badgeText}; font-size: 11px; font-weight: 700; letter-spacing: 0.2px;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        `;
      })
      .join('');

    return `
      <div style="margin-top: 24px; margin-bottom: 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${group.dotColor}; margin-right: 6px; vertical-align: middle;"></span>
              <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${group.headerColor}; vertical-align: middle;">
                ${escapeHtml(group.label)}
              </span>
              ${
                group.sublabel
                  ? `<span style="font-size: 11px; font-weight: 500; color: #64748b; text-transform: none; margin-left: 4px; vertical-align: middle;">(${escapeHtml(group.sublabel)})</span>`
                  : ''
              }
              <span style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-left: 4px; vertical-align: middle;">
                (${group.items.length})
              </span>
            </td>
          </tr>
        </table>
      </div>
      <div>
        ${itemsHtml}
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
      <div class="subtitle">Upcoming Deadlines & Schedule for ${escapeHtml(semesterName)}</div>
    </div>
    <div class="content">
      <div class="greeting">Good morning, ${escapeHtml(userName) || 'Scholar'}!</div>
      ${
        totalCount === 0
          ? `
      <p>Here is your weekly academic briefing for <strong>${escapeHtml(semesterName)}</strong>.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px; margin: 20px 0; text-align: center;">
        <div style="font-size: 16px; font-weight: 700; color: #166534; margin-bottom: 4px;">🎉 All Caught Up!</div>
        <div style="font-size: 13px; color: #15803d; line-height: 1.5;">You currently have zero pending deadlines or overdue assignments scheduled for this term.</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">Whenever you add assignments or exam dates in eStudesk, they will automatically be organized week-by-week in this weekly briefing.</p>
      `
          : `
      <p>Here is your date-wise academic schedule for <strong>${escapeHtml(semesterName)}</strong>. You have <strong>${totalCount} active item${totalCount > 1 ? 's' : ''}</strong> tracked in your semester workspace:</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 18px 0 22px 0; background-color: #fcfbf9; border: 1px solid #e8e3d9; border-radius: 12px;">
        <tr>
          <td align="center" style="padding: 12px; border-right: 1px solid #e8e3d9; width: 33%;">
            <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${totalCount}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Total Active</div>
          </td>
          <td align="center" style="padding: 12px; border-right: 1px solid #e8e3d9; width: 33%;">
            <div style="font-size: 18px; font-weight: 700; color: #0284c7;">${thisWeekCount}</div>
            <div style="font-size: 11px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">This Week</div>
          </td>
          <td align="center" style="padding: 12px; width: 34%;">
            <div style="font-size: 18px; font-weight: 700; color: ${urgentCount > 0 ? '#e11d48' : '#166534'};">${urgentCount}</div>
            <div style="font-size: 11px; color: ${urgentCount > 0 ? '#e11d48' : '#166534'}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">${urgentCount > 0 ? 'Overdue / Today' : 'Urgent'}</div>
          </td>
        </tr>
      </table>

      ${groups.map((group) => renderGroupHtml(group)).join('')}
      `
      }

      <div style="text-align: center; margin-top: 30px;">
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

  if (groups.length === 0) {
    textLines.push('All caught up! You have 0 active or overdue deadlines scheduled.');
  } else {
    for (const g of groups) {
      const range = g.sublabel ? ` (${g.sublabel})` : '';
      textLines.push(`[${g.label.toUpperCase()}${range}] (${g.items.length})`);
      for (const item of g.items) {
        const sub = item.subjectName ? `[${item.subjectName}] ` : '';
        const dueStr = formatItemDueDate(item.dueDate);
        const rel = getRelativeStatusLabel(item.dueDate, nowTs);
        const desc = item.description ? ` - ${item.description}` : '';
        textLines.push(`  • ${sub}${item.title} — Due: ${dueStr} (${rel})${desc}`);
      }
      textLines.push('');
    }
  }

  textLines.push(`Open your desk: ${appUrl}`);
  const text = textLines.join('\n');

  return { html, text, totalCount, thisWeekCount, urgentCount };
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
