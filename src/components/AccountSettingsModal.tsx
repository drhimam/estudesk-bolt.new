import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  CreditCard,
  Coins,
  Receipt,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Globe,
  School,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Laptop,
  Flame,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  useAppState,
  closeAccountModal,
  setCurrentUser,
  updateUserCredits,
  AccountTab,
} from '@/store/appState';
import { API_BASE_URL } from '@/lib/authClient';
import type { SubscriptionPlan, InvoiceRecord, CreditTransaction, SessionItem } from '@/types';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';

const INITIAL_DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    billingCycle: 'once',
    durationMonths: 1,
    priceAmount: 0.0,
    currency: 'USD',
    discountPercent: 0,
    discountReason: null,
    isActive: true,
    aiCreditsMonthly: 100,
    features: [
      '100 Initial AI Generation Credits',
      'Basic Study Notes & Flashcards Generator',
      'Offline-First Local Storage + Cloud Sync',
      'Standard AI Generation Queue',
      'Export Study Materials to TXT',
    ],
    sortOrder: 1,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    billingCycle: 'monthly',
    durationMonths: 1,
    priceAmount: 9.99,
    currency: 'USD',
    discountPercent: 0,
    discountReason: null,
    isActive: true,
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month',
      'All 7 Study Formats (Notes, Cheatsheets, Flashcards, Quizzes, Infographics, Assignments, Slides)',
      'Multi-Modal Source Extraction (PDF, DOCX, TXT, CSV, Audio, OCR)',
      '24h Deadline Email Alerts & Monday Weekly Digests',
      'Priority High-Speed Multi-Model AI Router',
      'Rich PDF, TXT, & JSON Study Material Downloads',
    ],
    sortOrder: 2,
  },
  {
    id: 'pro_semester',
    name: 'Pro Semester (4 Months)',
    billingCycle: 'semester',
    durationMonths: 4,
    priceAmount: 29.99,
    currency: 'USD',
    discountPercent: 25,
    discountReason: 'Semester Saver • 25% Off',
    isActive: true,
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month (4,000 total credits)',
      'Full University 4-Month Semester Coverage',
      'All 7 Study Material Formats with Instant AI Refinements',
      'Multi-Modal Source Extraction (PDF, OCR Image, Audio Transcripts)',
      '24h Deadline Alerts & Timezone-Aware Weekly Digests',
      'Full Semester Archive One-Click Student Backup',
      'Dedicated High-Throughput AI Priority Queue',
    ],
    sortOrder: 3,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    billingCycle: 'yearly',
    durationMonths: 12,
    priceAmount: 79.99,
    currency: 'USD',
    discountPercent: 35,
    discountReason: 'Annual Best Value • 35% Off',
    isActive: false,
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month (12,000 total credits)',
      'Full 12-Month Academic Access to All Features',
      'All 7 Study Material Types & Infinite Version History',
      'Advanced Multi-Modal File Parser & Instant Tesseract OCR',
      'Priority Email Notifications & Weekly Digest Reports',
      'VIP Priority AI Routing & Early Feature Access',
    ],
    sortOrder: 4,
  },
];

export function AccountSettingsModal() {
  const { accountModalOpen, accountModalTab, currentUser } = useAppState();
  const userId = currentUser?.id;
  const [activeTab, setActiveTab] = useState<AccountTab>(accountModalTab || 'profile');

  // Profile State
  const [name, setName] = useState(currentUser?.name || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(currentUser?.fieldOfStudy || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [timezone, setTimezone] = useState(
    currentUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Plans & Billing State
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_DEFAULT_PLANS);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    tier: string;
    planId: string;
    creditBalance: number;
    monthlyQuotaLimit: number;
    subscription?: unknown;
    recentTransactions: CreditTransaction[];
  } | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<CreditTransaction[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const [loadingBilling, setLoadingBilling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingNotice, setBillingNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<SubscriptionPlan | null>(null);

  // Delete modal state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync tab with props
  useEffect(() => {
    if (accountModalTab) {
      setActiveTab(accountModalTab);
    }
  }, [accountModalTab, accountModalOpen]);

  // Synchronize local form fields if currentUser changes from outside
  useEffect(() => {
    if (currentUser) {
      setName((prev) => (prev ? prev : (currentUser.name || '')));
      setInstitution((prev) => (prev ? prev : (currentUser.institution || '')));
      setFieldOfStudy((prev) => (prev ? prev : (currentUser.fieldOfStudy || '')));
      setBio((prev) => (prev ? prev : (currentUser.bio || '')));
      setTimezone((prev) => (prev ? prev : (currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')));
    }
  }, [currentUser?.id]);

  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setName(d.name || '');
          setInstitution(d.institution || '');
          setFieldOfStudy(d.fieldOfStudy || '');
          setBio(d.bio || '');
          setTimezone(d.timezone || 'UTC');
          if (d.creditBalance !== undefined) {
            updateUserCredits(d.creditBalance);
          }
        }
      }
    } catch {
      // Ignored network retry
    }
  }, [userId]);

  const fetchPlansAndSubscription = useCallback(async () => {
    if (!userId) return;
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/billing/plans`),
        fetch(`${API_BASE_URL}/api/billing/subscription?userId=${encodeURIComponent(userId)}`),
      ]);

      if (plansRes.ok) {
        const plansJson = await plansRes.json();
        if (Array.isArray(plansJson.data) && plansJson.data.length > 0) {
          setPlans(plansJson.data);
        }
      }

      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubscriptionDetails(subJson.data || null);
        if (subJson.data?.creditBalance !== undefined) {
          updateUserCredits(subJson.data.creditBalance);
        }
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    }
  }, [userId]);

  const fetchInvoices = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/invoices?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data || []);
      }
    } catch {
      // Ignored network retry
    }
  }, [userId]);

  const fetchUsage = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/usage?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        setUsageLogs(json.data || []);
      }
    } catch {
      // Ignored network retry
    }
  }, [userId]);

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/sessions?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        setSessions(json.data || []);
      }
    } catch {
      // Ignored network retry
    }
  }, [userId]);

  // Load user data & plans whenever modal opens
  useEffect(() => {
    if (!accountModalOpen || !userId) return;

    fetchPlansAndSubscription();
    fetchUserProfile();
    fetchInvoices();
    fetchUsage();
    fetchSessions();
  }, [accountModalOpen, userId, fetchInvoices, fetchPlansAndSubscription, fetchSessions, fetchUsage, fetchUserProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          institution,
          fieldOfStudy,
          bio,
          timezone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setProfileError(json.error || 'Failed to update profile.');
      } else {
        setProfileSuccess('Profile updated successfully!');
        setCurrentUser({
          ...currentUser,
          name,
          institution,
          fieldOfStudy,
          bio,
          timezone,
        });
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePlanSelect(plan: SubscriptionPlan) {
    if (!plan.isActive) return;
    if (!currentUser?.id) return;

    const activePlanId = subscriptionDetails?.planId || (isPro ? 'pro_monthly' : 'free');
    if (plan.id === activePlanId) return;

    // Paid Plan Upgrade / Switch -> Open PayPal Checkout Modal
    if (plan.id !== 'free') {
      setSelectedCheckoutPlan(plan);
      return;
    }

    // Downgrade to Free
    if (plan.id === 'free' && isPro) {
      if (!confirm('Are you sure you want to downgrade to Free? Your Pro plan and credits will remain active until the end of your billing cycle.')) {
        return;
      }
    }

    setActionLoading(true);
    setBillingNotice(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          planId: 'free',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setBillingNotice({ type: 'error', text: json.error || 'Failed to update subscription plan.' });
      } else {
        setBillingNotice({
          type: 'success',
          text: json.message || `Your plan is now set to Free.`,
        });
        fetchPlansAndSubscription();
        fetchInvoices();
        fetchUsage();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setBillingNotice({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!currentUser?.id) return;
    if (!confirm('Are you sure you want to cancel automatic subscription renewal? You will retain Pro access until the end of your billing cycle.')) {
      return;
    }

    setActionLoading(true);
    setBillingNotice(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        setBillingNotice({ type: 'error', text: json.error || 'Failed to cancel renewal.' });
      } else {
        setBillingNotice({ type: 'success', text: 'Auto-renewal has been cancelled. Your benefits remain active until the end of the period.' });
        fetchPlansAndSubscription();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setBillingNotice({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadArchive() {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/export-data?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estudesk-archive-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      alert('Failed to download student archive.');
    }
  }

  function handleDownloadInvoicePdf(inv: InvoiceRecord) {
    try {
      const doc = new jsPDF();
      const margin = 20;

      // Dark Header Bar
      doc.setFillColor(30, 41, 59); // ink-800
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('eStudesk', margin, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('OFFICIAL PAYMENT RECEIPT', 210 - margin, 24, { align: 'right' });

      // Invoice Meta
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice: ${inv.invoiceNumber}`, margin, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date Issued: ${new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}`, margin, 63);
      doc.text(`Status: PAID`, margin, 71);

      // Student Details
      doc.text(`Billed To:`, 130, 55);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${currentUser?.name || 'Student'}`, 130, 63);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${currentUser?.email || ''}`, 130, 71);
      if (currentUser?.institution) {
        doc.text(`${currentUser.institution}`, 130, 79);
      }

      // Items Table
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, 95, 170, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Description', margin + 4, 102);
      doc.text('Billing Period', 110, 102);
      doc.text('Amount', 185, 102, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.text(inv.planName, margin + 4, 118);
      doc.text(inv.billingPeriod || 'Standard Period', 110, 118);
      doc.text(`$${inv.amount.toFixed(2)} USD`, 185, 118, { align: 'right' });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 130, 190, 130);

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Paid:', 130, 142);
      doc.text(`$${inv.amount.toFixed(2)} USD`, 185, 142, { align: 'right' });

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for subscribing to eStudesk. Keep this receipt for your academic expense records.', 105, 270, {
        align: 'center',
      });

      doc.save(`eStudesk-Receipt-${inv.invoiceNumber}.pdf`);
    } catch {
      alert('Failed to generate PDF receipt.');
    }
  }

  async function handleDeleteAccount() {
    if (!currentUser?.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        alert('Your account has been scheduled for deletion with a 30-day grace period. You will now be signed out.');
        closeAccountModal();
        setCurrentUser(null);
        window.location.reload();
      }
    } catch {
      alert('Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!accountModalOpen) return null;

  const currentTier = (currentUser?.tier || subscriptionDetails?.tier || 'free').toLowerCase();
  const isPro = currentTier.includes('pro') || currentTier.includes('premium');
  const creditBalance = subscriptionDetails?.creditBalance ?? currentUser?.credits ?? (isPro ? 1000 : 100);
  const maxCredits = isPro ? 1000 : 100;
  const creditPercentage = Math.min(100, Math.max(0, (creditBalance / maxCredits) * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-ink-950/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#fbfbf9] w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[#d6e0db] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2ece6] bg-[#f0f6f2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-600 to-indigo-700 flex items-center justify-center text-white shadow-soft">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink-900 leading-tight">
                Account & Billing Settings
              </h2>
              <p className="text-xs text-ink-500">
                Manage your identity, dynamic subscription plans, and AI credits
              </p>
            </div>
          </div>

          <button
            onClick={closeAccountModal}
            className="p-2 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-[#e2ece6] bg-white overflow-x-auto scrollbar-none shrink-0">
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<User className="w-4 h-4" />}
            label="Profile & Identity"
          />
          <TabButton
            active={activeTab === 'subscription'}
            onClick={() => setActiveTab('subscription')}
            icon={<CreditCard className="w-4 h-4" />}
            label="Plans & Upgrades"
            badge={isPro ? 'Pro Active' : undefined}
          />
          <TabButton
            active={activeTab === 'usage'}
            onClick={() => setActiveTab('usage')}
            icon={<Coins className="w-4 h-4" />}
            label="AI Credits & Meter"
            badge={`${creditBalance} cr`}
          />
          <TabButton
            active={activeTab === 'invoices'}
            onClick={() => setActiveTab('invoices')}
            icon={<Receipt className="w-4 h-4" />}
            label="Invoices & Receipts"
          />
          <TabButton
            active={activeTab === 'privacy'}
            onClick={() => setActiveTab('privacy')}
            icon={<Shield className="w-4 h-4" />}
            label="Privacy & GDPR"
          />
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 sm:p-7 select-text">
          
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#d6e0db] shadow-soft">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-ink-900 truncate">
                      {name || 'Student Scholar'}
                    </h3>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                      isPro ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-accent-100 text-accent-700'
                    }`}>
                      {isPro ? 'Pro Member' : 'Free Member'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5 truncate">{currentUser?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Email Verified
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      <Coins className="w-3 h-3 text-indigo-600" />
                      {creditBalance} AI Credits Available
                    </span>
                  </div>
                </div>
              </div>

              {profileNotice(profileSuccess, profileError)}

              <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-6 rounded-2xl border border-[#d6e0db] shadow-soft">
                <h4 className="font-serif text-sm font-semibold text-ink-900 pb-2 border-b border-paper-200">
                  Personal & Academic Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      required
                      className="w-full text-xs sm:text-sm bg-[#fafbfa] border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-800 focus:bg-white focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full text-xs sm:text-sm bg-paper-100 border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-accent-600" />
                      <span>University / School</span>
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. UC Berkeley, Harvard Medical"
                      className="w-full text-xs sm:text-sm bg-[#fafbfa] border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-800 focus:bg-white focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Major / Field of Study</span>
                    </label>
                    <input
                      type="text"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      placeholder="e.g. Computer Science, Bioengineering"
                      className="w-full text-xs sm:text-sm bg-[#fafbfa] border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-800 focus:bg-white focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Academic Bio & Focus Goal
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief note about what you are preparing for (e.g. MCAT, USMLE, Fall Midterms)..."
                    className="w-full text-xs sm:text-sm bg-[#fafbfa] border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-800 focus:bg-white focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Timezone (for Weekly Digests)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')}
                      className="text-[11px] text-accent-700 hover:underline cursor-pointer"
                    >
                      Auto-detect local
                    </button>
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-[#fafbfa] border border-[#d6e0db] rounded-xl px-3.5 py-2.5 text-ink-800 focus:bg-white focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs sm:text-sm font-semibold shadow-soft hover:shadow-card transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION & DYNAMIC PLANS */}
          {activeTab === 'subscription' && (
            <div className="space-y-6 animate-fade-in">
              {/* Active Plan Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#eef6f1] to-[#e8eef8] border border-[#bed6c7] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Your Current Plan
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isPro ? 'bg-amber-400 text-ink-900 shadow-sm' : 'bg-accent-600 text-white'
                    }`}>
                      {isPro ? 'Pro Active' : 'Free Tier'}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-ink-900 mt-1">
                    {isPro ? 'Pro Student Unlimited Suite' : 'Free Scholar (100 Initial Credits)'}
                  </h3>
                  <p className="text-xs text-ink-600 mt-1">
                    {isPro
                      ? 'You have full access to all 7 study formats, OCR extraction, audio processing, 24h deadline alerts, and 1,000 monthly credits.'
                      : 'You have 100 initial AI generation credits. Upgrade to Pro for 1,000 credits/mo and 24h deadline email notifications.'}
                  </p>
                </div>

                {isPro && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-crimson-700 hover:bg-crimson-50 border border-crimson-200 transition-colors cursor-pointer shrink-0"
                  >
                    Cancel Auto-Renewal
                  </button>
                )}
              </div>

              {billingNotice && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
                    billingNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-crimson-50 text-crimson-800 border border-crimson-200'
                  }`}
                >
                  {billingNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-crimson-600 shrink-0" />
                  )}
                  <span>{billingNotice.text}</span>
                </div>
              )}

              {/* Dynamic Database Plans Grid */}
              <div>
                <div className="text-center mb-6">
                  <h3 className="font-serif text-xl font-bold text-ink-900">
                    Transparent Student Plans
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-500 mt-1 max-w-lg mx-auto">
                    Database-driven pricing with instant credit allocation. Safe encrypted checkout.
                  </p>
                </div>

                {loadingBilling ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                      const isCurrent = (isPro && plan.id.startsWith('pro_')) || (!isPro && plan.id === 'free');
                      const hasDiscount = plan.discountPercent > 0;
                      const originalPrice = hasDiscount
                        ? (plan.priceAmount / (1 - plan.discountPercent / 100)).toFixed(2)
                        : null;

                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                            plan.id === 'pro_semester'
                              ? 'bg-gradient-to-b from-white to-[#f7fbf9] border-emerald-500 ring-2 ring-emerald-500/20 shadow-card'
                              : plan.isActive
                                ? 'bg-white border-[#d6e0db] hover:border-accent-300 shadow-soft'
                                : 'bg-[#f4f6f5] border-[#d8e0dc] opacity-80'
                          }`}
                        >
                          {/* Top Tag */}
                          {hasDiscount && plan.discountReason && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                              <Flame className="w-3 h-3" />
                              <span>{plan.discountReason}</span>
                            </div>
                          )}

                          {!plan.isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm uppercase tracking-wider whitespace-nowrap">
                              Coming Soon
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mt-1 mb-2">
                              <h4 className="font-serif text-base font-bold text-ink-900">
                                {plan.name}
                              </h4>
                              {plan.id === 'pro_semester' && (
                                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  BEST VALUE
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                              <div className="flex items-baseline gap-1.5">
                                {hasDiscount && originalPrice && (
                                  <span className="text-sm font-semibold text-ink-400 line-through">
                                    ${originalPrice}
                                  </span>
                                )}
                                <span className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
                                  ${plan.priceAmount.toFixed(2)}
                                </span>
                                <span className="text-xs text-ink-500">
                                  {plan.billingCycle === 'once'
                                    ? '/ once'
                                    : plan.billingCycle === 'semester'
                                      ? '/ 4 mo'
                                      : plan.billingCycle === 'yearly'
                                        ? '/ yr'
                                        : '/ mo'}
                                </span>
                              </div>
                              {plan.billingCycle === 'semester' && (
                                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                  Only ${(plan.priceAmount / 4).toFixed(2)} / month
                                </p>
                              )}
                            </div>

                            {/* Credits highlight */}
                            <div className="p-2.5 rounded-xl bg-accent-50/70 border border-accent-100 mb-4 flex items-center gap-2">
                              <Coins className="w-4 h-4 text-accent-700 shrink-0" />
                              <span className="text-xs font-semibold text-accent-900">
                                {plan.aiCreditsMonthly.toLocaleString()} AI Credits / mo
                              </span>
                            </div>

                            {/* Feature bullet list */}
                            {plan.isActive ? (
                              <ul className="space-y-2 mb-6">
                                {plan.features.map((feat, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs text-ink-700 leading-snug">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="p-3 my-4 rounded-xl bg-white border border-dashed border-paper-300 text-center">
                                <p className="text-xs font-semibold text-ink-600">Annual Plan in Progress</p>
                                <p className="text-[11px] text-ink-400 mt-0.5">
                                  Includes all 12-month features with dedicated VIP support.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
                            {plan.isActive ? (
                              <button
                                onClick={() => handlePlanSelect(plan)}
                                disabled={actionLoading || (isPro && plan.id.startsWith('pro_'))}
                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-soft cursor-pointer flex items-center justify-center gap-1.5 ${
                                  plan.id === 'pro_semester'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-card hover:shadow-glow'
                                    : plan.id === 'pro_monthly'
                                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      : 'bg-paper-100 hover:bg-paper-200 text-ink-700 border border-paper-300'
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                              >
                                {actionLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isCurrent && isPro ? (
                                  <span>Active Plan</span>
                                ) : plan.id === 'free' ? (
                                  <span>Current Free Tier</span>
                                ) : (
                                  <>
                                    <span>Choose {plan.name}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-paper-200 text-ink-400 cursor-not-allowed text-center"
                              >
                                Coming Soon
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI CREDITS & USAGE METER */}
          {activeTab === 'usage' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              {/* Credit Balance Card */}
              <div className="p-6 rounded-2xl bg-white border border-[#d6e0db] shadow-soft">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Live AI Credits Balance
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-accent-700">
                        {creditBalance.toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-ink-500">
                        / {maxCredits.toLocaleString()} Credits
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">
                      {isPro
                        ? '1,000 monthly credits renewed automatically. Unused credits rollover within active billing cycle.'
                        : 'Free tier includes 100 initial AI generation credits.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('subscription')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-soft hover:shadow-card transition-all cursor-pointer shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Get More Credits</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold text-ink-600 mb-1.5">
                    <span>Quota Meter</span>
                    <span>{creditPercentage.toFixed(0)}% Available</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#e8ece9] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        creditPercentage > 30 ? 'bg-gradient-to-r from-accent-500 to-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${creditPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Credit Cost Reference Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-paper-200">
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#e2eae4] text-center">
                    <p className="text-[11px] text-ink-500">Notes / Cheatsheet</p>
                    <p className="text-sm font-bold text-ink-800 mt-0.5">2 Credits</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#e2eae4] text-center">
                    <p className="text-[11px] text-ink-500">Quiz / Flashcards</p>
                    <p className="text-sm font-bold text-ink-800 mt-0.5">2 Credits</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#e2eae4] text-center">
                    <p className="text-[11px] text-ink-500">Infographic / Slides</p>
                    <p className="text-sm font-bold text-ink-800 mt-0.5">5 Credits</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#e2eae4] text-center">
                    <p className="text-[11px] text-ink-500">Ask AI Question</p>
                    <p className="text-sm font-bold text-ink-800 mt-0.5">1 Credit</p>
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div className="bg-white rounded-2xl border border-[#d6e0db] shadow-soft overflow-hidden">
                <div className="px-5 py-3.5 border-b border-paper-200 bg-[#f9fbfa]">
                  <h4 className="font-serif text-sm font-bold text-ink-900">
                    Recent Credit Activity & Telemetry
                  </h4>
                </div>

                {usageLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-400">
                    No credit transactions recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-paper-100 max-h-72 overflow-y-auto scrollbar-thin">
                    {usageLogs.map((tx) => (
                      <div key={tx.id} className="px-5 py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              tx.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600'
                            }`}
                          >
                            {tx.amount > 0 ? '+' : '-'}
                          </div>
                          <div>
                            <p className="font-semibold text-ink-800">{tx.description}</p>
                            <p className="text-[10px] text-ink-400">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              tx.amount > 0 ? 'text-emerald-600' : 'text-ink-700'
                            }`}
                          >
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} cr
                          </span>
                          <span className="block text-[10px] text-ink-400 font-mono">
                            Bal: {tx.balanceAfter}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES & RECEIPTS */}
          {activeTab === 'invoices' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-ink-900">
                    Billing History & Expense Receipts
                  </h3>
                  <p className="text-xs text-ink-500">
                    Download official university academic expense PDF receipts
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#d6e0db] shadow-soft overflow-hidden">
                {invoices.length === 0 ? (
                  <div className="p-12 text-center">
                    <Receipt className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-ink-700">No Invoices Yet</p>
                    <p className="text-xs text-ink-400 mt-1">
                      Invoices will appear here automatically when you upgrade to a paid plan.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f9fbfa] text-ink-500 uppercase font-mono text-[10px] border-b border-paper-200">
                        <tr>
                          <th className="px-5 py-3">Invoice #</th>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Plan / Description</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-100 text-ink-700">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-paper-50 transition-colors">
                            <td className="px-5 py-3.5 font-mono font-semibold text-ink-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-5 py-3.5 text-ink-500">
                              {new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 font-medium">{inv.planName}</td>
                            <td className="px-5 py-3.5 font-mono font-bold text-ink-900">
                              ${inv.amount.toFixed(2)} {inv.currency}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDownloadInvoicePdf(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-accent-700 hover:bg-accent-50 border border-accent-200 transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & GDPR DATA */}
          {activeTab === 'privacy' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              {/* GDPR Data Archive */}
              <div className="p-6 rounded-2xl bg-white border border-[#d6e0db] shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-accent-50 text-accent-700">
                    <Download className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-base font-bold text-ink-900">
                      Download Full Student Data Archive
                    </h4>
                    <p className="text-xs text-ink-500 mt-1">
                      In compliance with GDPR & Privacy-First directives, you can download a complete JSON archive of all your semesters, subjects, generated study notes, flashcards, quizzes, deadlines, and chat logs at any time.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={handleDownloadArchive}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-soft hover:shadow-card transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Student Archive (.json)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Deletion */}
              <div className="p-6 rounded-2xl bg-crimson-50/50 border border-crimson-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-crimson-100 text-crimson-700">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-base font-bold text-crimson-900">
                      Delete Account & Erase Cloud Data
                    </h4>
                    <p className="text-xs text-crimson-800/80 mt-1">
                      Initiates a soft deletion with a 30-day grace period. After 30 days, your account and all associated cloud data will be permanently erased.
                    </p>

                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-white border border-crimson-300 text-crimson-700 text-xs font-semibold hover:bg-crimson-50 transition-colors cursor-pointer"
                      >
                        Request Account Deletion
                      </button>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-white border border-crimson-300 space-y-3">
                        <p className="text-xs font-bold text-crimson-900">
                          ⚠️ Are you absolutely certain you want to schedule account deletion?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg bg-crimson-600 hover:bg-crimson-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {deleteLoading ? 'Processing...' : 'Yes, Delete My Account'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-2 rounded-lg bg-paper-100 text-ink-700 text-xs font-medium hover:bg-paper-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e2ece6] bg-[#f0f6f2] flex items-center justify-between text-xs text-ink-500 shrink-0">
          <span>eStudesk Privacy-First Study Suite</span>
          <button
            onClick={closeAccountModal}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#d6e0db] text-ink-700 font-semibold hover:bg-paper-100 shadow-soft cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
        {/* PayPal Checkout Modal */}
        <PayPalCheckoutModal
          isOpen={!!selectedCheckoutPlan}
          onClose={() => setSelectedCheckoutPlan(null)}
          plan={selectedCheckoutPlan}
          userId={userId || ''}
          userEmail={currentUser?.email}
          onSuccess={(planName) => {
            setBillingNotice({
              type: 'success',
              text: `🎉 Successfully activated ${planName}! 1,000 monthly credits added.`,
            });
            if (currentUser) {
              setCurrentUser({
                ...currentUser,
                tier: 'Pro',
              });
            }
            fetchPlansAndSubscription();
            fetchInvoices();
            fetchUsage();
          }}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-accent-600 text-white shadow-soft'
          : 'text-ink-600 hover:text-ink-900 hover:bg-paper-100'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase ${
            active ? 'bg-white/20 text-white' : 'bg-accent-100 text-accent-800'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function profileNotice(success: string | null, error: string | null) {
  if (!success && !error) return null;
  return (
    <div
      className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
        success
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'bg-crimson-50 text-crimson-800 border border-crimson-200'
      }`}
    >
      {success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-crimson-600 shrink-0" />
      )}
      <span>{success || error}</span>
    </div>
  );
}
