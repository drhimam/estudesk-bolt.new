import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Mail,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAppState, closeNotificationModal } from '@/store/appState';
import { API_BASE_URL } from '@/lib/authClient';

interface NotificationPreferences {
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: string;
  weeklyDigestTime: string;
  deadlineAlertEnabled: boolean;
  deadlineAlertHoursBefore: number;
  timezone: string;
  emailFormat: 'html' | 'plain';
}

interface NotificationLogItem {
  id: string;
  notificationType: string;
  provider: string;
  providerMessageId?: string | null;
  status: string;
  errorMessage?: string | null;
  createdAt: string | number;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, id, label, disabled = false }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md transition-colors ${
        checked ? 'bg-accent-100 text-accent-800' : 'bg-paper-200 text-ink-400'
      }`}>
        {checked ? 'Active' : 'Disabled'}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle notification'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 ${
          checked ? 'bg-accent-600' : 'bg-ink-200 hover:bg-ink-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsModal() {
  const { notificationModalOpen, currentUser } = useAppState();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    weeklyDigestEnabled: true,
    weeklyDigestDay: 'monday',
    weeklyDigestTime: '08:00',
    deadlineAlertEnabled: true,
    deadlineAlertHoursBefore: 24,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    emailFormat: 'html',
  });

  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [limits, setLimits] = useState<{
    testEmail: { allowed: boolean; nextAllowedAt?: string | null; remainingDays?: number };
    digestPreview: { allowed: boolean; nextAllowedAt?: string | null; remainingDays?: number };
  }>({
    testEmail: { allowed: true },
    digestPreview: { allowed: true },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [digestSending, setDigestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load preferences, limits and logs when modal opens
  useEffect(() => {
    if (!notificationModalOpen || !currentUser) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [prefsRes, logsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notifications/preferences?userId=${encodeURIComponent(currentUser!.id)}`),
          fetch(`${API_BASE_URL}/api/notifications/logs?userId=${encodeURIComponent(currentUser!.id)}`),
        ]);

        if (prefsRes.ok && isMounted) {
          const json = await prefsRes.json();
          if (json.data) {
            setPrefs({
              weeklyDigestEnabled: json.data.weeklyDigestEnabled ?? true,
              weeklyDigestDay: json.data.weeklyDigestDay || 'monday',
              weeklyDigestTime: json.data.weeklyDigestTime || '08:00',
              deadlineAlertEnabled: json.data.deadlineAlertEnabled ?? true,
              deadlineAlertHoursBefore: Number(json.data.deadlineAlertHoursBefore) || 24,
              timezone: json.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              emailFormat: json.data.emailFormat || 'html',
            });
          }
          if (json.limits) {
            setLimits(json.limits);
          }
        }

        if (logsRes.ok && isMounted) {
          const json = await logsRes.json();
          if (json.data) {
            setLogs(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [notificationModalOpen, currentUser]);

  if (!notificationModalOpen) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        userId: currentUser.id,
        weeklyDigestEnabled: Boolean(prefs.weeklyDigestEnabled),
        weeklyDigestDay: prefs.weeklyDigestDay,
        weeklyDigestTime: prefs.weeklyDigestTime,
        deadlineAlertEnabled: Boolean(prefs.deadlineAlertEnabled),
        deadlineAlertHoursBefore: Number(prefs.deadlineAlertHoursBefore),
        timezone: prefs.timezone,
        emailFormat: prefs.emailFormat,
      };

      const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update notification preferences.');
      }

      setStatusMessage({ type: 'success', text: '✓ Notification preferences saved successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail() {
    if (!currentUser) return;
    setTestSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to dispatch test email.');
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Test email dispatched to ${currentUser.email}!`,
      });

      // Update test email limit locally and refresh logs
      setLimits((prev) => ({
        ...prev,
        testEmail: {
          allowed: false,
          nextAllowedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 30,
        },
      }));

      const logsRes = await fetch(`${API_BASE_URL}/api/notifications/logs?userId=${encodeURIComponent(currentUser.id)}`);
      if (logsRes.ok) {
        const logData = await logsRes.json();
        if (logData.data) setLogs(logData.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test email failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setTestSending(false);
    }
  }

  async function handleSendWeeklyDigest() {
    if (!currentUser) return;
    setDigestSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/send-digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isPreview: true }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to dispatch weekly digest preview.');
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Weekly deadline digest preview dispatched to ${currentUser.email}.`,
      });

      // Update digest preview limit locally and refresh logs
      setLimits((prev) => ({
        ...prev,
        digestPreview: {
          allowed: false,
          nextAllowedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 30,
        },
      }));

      const logsRes = await fetch(`${API_BASE_URL}/api/notifications/logs?userId=${encodeURIComponent(currentUser.id)}`);
      if (logsRes.ok) {
        const logData = await logsRes.json();
        if (logData.data) setLogs(logData.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Digest dispatch failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setDigestSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-paper-300 shadow-lifted overflow-hidden transform animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-accent-600 via-accent-700 to-indigo-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Email &amp; Notification Settings</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Cloud Mail
                </span>
              </h2>
              <p className="text-xs text-paper-200">
                Configure deadline digests, urgent alerts, and study schedule deliverability
              </p>
            </div>
          </div>
          <button
            onClick={closeNotificationModal}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-crimson-50 border-crimson-200 text-crimson-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-crimson-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Mailbox Connection Status Card */}
          <div className="p-4 rounded-2xl bg-[#f7f3ec] border border-[#e2dcd0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center text-accent-700 shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                  <span>Recipient: {currentUser?.email || 'Scholar'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-ink-500">
                  Service Status: <span className="font-medium text-emerald-700">Operational &amp; Connected</span>
                  <span className="ml-2 text-ink-400">&bull; Test Limit: 1/month</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testSending || loading || !limits.testEmail.allowed}
                title={!limits.testEmail.allowed ? `Monthly limit reached. Next available: ${limits.testEmail.nextAllowedAt ? new Date(limits.testEmail.nextAllowedAt).toLocaleDateString() : 'next month'}` : 'Send test verification email (1 per month)'}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-white border border-paper-300 hover:border-accent-500 text-ink-700 text-xs font-semibold shadow-soft hover:shadow-card transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                    <span>Sending...</span>
                  </>
                ) : !limits.testEmail.allowed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink-400" />
                    <span>Test Sent (1/month)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-accent-600" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
              {!limits.testEmail.allowed && limits.testEmail.nextAllowedAt && (
                <span className="text-[10px] text-ink-400 text-center sm:text-right">
                  Next available on {new Date(limits.testEmail.nextAllowedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Section 1: Weekly Deadline Digest */}
            <div className="p-5 rounded-2xl bg-white border border-paper-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink-800">Weekly Deadline Digest</h3>
                    <p className="text-[11px] text-ink-500">
                      Receive an academic summary of overdue, upcoming, and this week's deadlines
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  id="toggle-weekly-digest"
                  checked={prefs.weeklyDigestEnabled}
                  onChange={(val) => setPrefs((prev) => ({ ...prev, weeklyDigestEnabled: val }))}
                  label="Toggle Weekly Deadline Digest"
                  disabled={loading}
                />
              </div>

              {/* Sub-options for weekly digest */}
              <div
                className={`transition-all duration-200 ${
                  prefs.weeklyDigestEnabled
                    ? 'opacity-100'
                    : 'opacity-50 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-paper-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-600 mb-1">Dispatch Day</label>
                    <select
                      value={prefs.weeklyDigestDay}
                      disabled={!prefs.weeklyDigestEnabled}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, weeklyDigestDay: e.target.value }))}
                      className="w-full text-xs bg-paper-50 border border-paper-300 rounded-xl px-2.5 py-2 text-ink-800 focus:outline-none focus:border-accent-500 disabled:bg-paper-100"
                    >
                      <option value="monday">Monday (Recommended)</option>
                      <option value="sunday">Sunday Evening</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-600 mb-1">Delivery Time</label>
                    <select
                      value={prefs.weeklyDigestTime}
                      disabled={!prefs.weeklyDigestEnabled}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, weeklyDigestTime: e.target.value }))}
                      className="w-full text-xs bg-paper-50 border border-paper-300 rounded-xl px-2.5 py-2 text-ink-800 focus:outline-none focus:border-accent-500 disabled:bg-paper-100"
                    >
                      <option value="07:00">07:00 AM</option>
                      <option value="08:00">08:00 AM (Default)</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="12:00">12:00 PM (Noon)</option>
                      <option value="18:00">06:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-600 mb-1">Email Format</label>
                    <select
                      value={prefs.emailFormat}
                      disabled={!prefs.weeklyDigestEnabled}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, emailFormat: e.target.value as 'html' | 'plain' }))}
                      className="w-full text-xs bg-paper-50 border border-paper-300 rounded-xl px-2.5 py-2 text-ink-800 focus:outline-none focus:border-accent-500 disabled:bg-paper-100"
                    >
                      <option value="html">Rich Academic HTML</option>
                      <option value="plain">Accessible Plain Text</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    {!prefs.weeklyDigestEnabled ? (
                      <span className="text-[11px] text-ink-400 italic flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Digest is paused. Toggle switch above to re-enable schedule.
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-400">
                        Manual Preview Limit: <strong className="text-ink-600">1/month</strong>
                        {!limits.digestPreview.allowed && limits.digestPreview.nextAllowedAt && (
                          <span> (Next: {new Date(limits.digestPreview.nextAllowedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>
                        )}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleSendWeeklyDigest}
                      disabled={digestSending || loading || !prefs.weeklyDigestEnabled || !limits.digestPreview.allowed}
                      title={!limits.digestPreview.allowed ? `Monthly limit reached. Next available: ${limits.digestPreview.nextAllowedAt ? new Date(limits.digestPreview.nextAllowedAt).toLocaleDateString() : 'next month'}` : 'Dispatch a preview digest to your email (1 per month)'}
                      className="px-3 py-1.5 rounded-lg bg-paper-100 hover:bg-paper-200 text-ink-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto"
                    >
                      {digestSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                          <span>Generating Digest...</span>
                        </>
                      ) : !limits.digestPreview.allowed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-ink-400" />
                          <span>Preview Sent (1/month)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-accent-600" />
                          <span>Send Digest Preview Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Urgent Deadline Alerts */}
            <div className="p-5 rounded-2xl bg-white border border-paper-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink-800">Urgent Deadline Reminders</h3>
                    <p className="text-[11px] text-ink-500">
                      Dispatches immediate notices prior to assignment &amp; exam deadlines
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  id="toggle-deadline-alert"
                  checked={prefs.deadlineAlertEnabled}
                  onChange={(val) => setPrefs((prev) => ({ ...prev, deadlineAlertEnabled: val }))}
                  label="Toggle Urgent Deadline Reminders"
                  disabled={loading}
                />
              </div>

              <div
                className={`transition-all duration-200 ${
                  prefs.deadlineAlertEnabled
                    ? 'opacity-100'
                    : 'opacity-50 pointer-events-none'
                }`}
              >
                <div className="pt-3 border-t border-paper-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-ink-600">Remind me:</label>
                    <select
                      value={prefs.deadlineAlertHoursBefore}
                      disabled={!prefs.deadlineAlertEnabled}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, deadlineAlertHoursBefore: parseInt(e.target.value, 10) }))}
                      className="text-xs bg-paper-50 border border-paper-300 rounded-xl px-2.5 py-1.5 text-ink-800 focus:outline-none focus:border-accent-500 disabled:bg-paper-100"
                    >
                      <option value="12">12 hours before</option>
                      <option value="24">24 hours before (Default)</option>
                      <option value="48">48 hours before</option>
                      <option value="72">72 hours before (3 days)</option>
                    </select>
                  </div>

                  {!prefs.deadlineAlertEnabled && (
                    <span className="text-[11px] text-ink-400 italic flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Urgent alerts are paused.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-card hover:shadow-glow transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Preferences...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Section 3: Delivery History Log */}
          <div className="pt-4 border-t border-paper-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-ink-500" />
                <h3 className="text-xs font-bold text-ink-800">Recent Delivery History</h3>
              </div>
              <span className="text-[11px] text-ink-400">Retained for 90 days</span>
            </div>

            {logs.length === 0 ? (
              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 text-center text-xs text-ink-400">
                No notification delivery events recorded yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-paper-200 overflow-hidden bg-white shadow-soft">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper-100 text-ink-600 font-semibold border-b border-paper-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-paper-50/50">
                        <td className="py-2 px-3 font-medium text-ink-800 capitalize">
                          {log.notificationType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.status === 'sent' || log.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-crimson-100 text-crimson-700'
                            }`}
                          >
                            {log.status === 'sent' || log.status === 'delivered' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <AlertCircle className="w-2.5 h-2.5" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-ink-500 font-medium text-[11px]">
                          eStudesk Cloud Mail
                        </td>
                        <td className="py-2 px-3 text-ink-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
