'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getOrgInvestorsData,
  getOrgInvestorProfiles,
  createInvestorProfile,
  updateInvestorKycStatus,
  settleSubscription,
  rejectSubscription,
} from '../../../actions';
import {
  Plus,
  ExternalLink,
  Search,
  Coins,
} from '@/components/docs-icons';

export default function OrgInvestorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = parseInt(id, 10);

  const [offerings, setOfferings] = useState<any[]>([]);
  const [investorProfiles, setInvestorProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [updatingKycId, setUpdatingKycId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'registry' | 'subscriptions' | 'captable'
  >('registry');
  const [searchQuery, setSearchQuery] = useState('');

  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [submittingInvestor, setSubmittingInvestor] = useState(false);
  const [newInvestor, setNewInvestor] = useState({
    name: '',
    email: '',
    walletAddress: '',
    investorType: 'accredited',
    jurisdiction: 'US',
    kycStatus: 'approved',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getOrgInvestorsData(orgId),
      getOrgInvestorProfiles(orgId),
    ]).then(([offRes, invRes]) => {
      setOfferings(offRes);
      setInvestorProfiles(invRes);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const allSubscriptions = offerings.flatMap((off) =>
    (off.subscriptions || []).map((sub: any) => ({
      ...sub,
      offeringName: off.name,
      tokenSymbol: off.tokenSymbol || 'TOKEN',
      tokenSupply: Number(off.tokenSupply || 0),
      mintAddress: off.tokens?.[0]?.mintAddress || null,
    }))
  );

  const pendingSubscriptions = allSubscriptions.filter(
    (s) => s.status === 'pending'
  );

  const settledSubscriptions = allSubscriptions.filter(
    (s) =>
      s.status === 'settled' &&
      (selectedOfferingId === 'all' ||
        String(s.offeringId) === selectedOfferingId)
  );

  const totalSettledCapital = allSubscriptions
    .filter((s) => s.status === 'settled')
    .reduce((sum, s) => sum + Number(s.amountUsd || 0), 0);

  const totalTokensAllocated = allSubscriptions
    .filter((s) => s.status === 'settled')
    .reduce((sum, s) => sum + Number(s.tokenQuantity || 0), 0);

  const enrichedInvestors = investorProfiles.map((inv) => {
    const matchingSubs = allSubscriptions.filter(
      (s) =>
        (inv.walletAddress &&
          s.investorWallet?.toLowerCase() ===
            inv.walletAddress.toLowerCase()) ||
        (inv.email && s.user?.email?.toLowerCase() === inv.email.toLowerCase())
    );
    const settledSubs = matchingSubs.filter((s) => s.status === 'settled');
    const totalInvestedUsd = settledSubs.reduce(
      (sum, s) => sum + Number(s.amountUsd || 0),
      0
    );
    const totalTokens = settledSubs.reduce(
      (sum, s) => sum + Number(s.tokenQuantity || 0),
      0
    );
    return {
      ...inv,
      subscriptionsCount: matchingSubs.length,
      totalInvestedUsd,
      totalTokens,
    };
  });

  const filteredInvestors = enrichedInvestors.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.name.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      (inv.walletAddress && inv.walletAddress.toLowerCase().includes(q)) ||
      inv.jurisdiction.toLowerCase().includes(q)
    );
  });

  const approvedKycCount = investorProfiles.filter(
    (i) => i.kycStatus === 'approved'
  ).length;

  async function handleOnboardInvestor(e: React.FormEvent) {
    e.preventDefault();
    if (!newInvestor.name.trim() || !newInvestor.email.trim()) return;
    setSubmittingInvestor(true);
    setActionError(null);
    const res = await createInvestorProfile(orgId, newInvestor);
    setSubmittingInvestor(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to onboard investor.');
    } else {
      setNewInvestor({
        name: '',
        email: '',
        walletAddress: '',
        investorType: 'accredited',
        jurisdiction: 'US',
        kycStatus: 'approved',
      });
      setShowOnboardForm(false);
      loadData();
    }
  }

  async function handleKycChange(
    investorId: number,
    status: 'pending' | 'approved' | 'rejected' | 'suspended'
  ) {
    setUpdatingKycId(investorId);
    setActionError(null);
    const res = await updateInvestorKycStatus(investorId, orgId, status);
    setUpdatingKycId(null);
    if (!res.success) {
      setActionError(res.error || 'Failed to update KYC status.');
    } else {
      loadData();
    }
  }

  async function handleSettle(subId: number) {
    setProcessingId(subId);
    setActionError(null);
    const res = await settleSubscription(subId);
    setProcessingId(null);
    if (!res.success) {
      setActionError(res.error || 'Failed to allocate tokens on Solana.');
    } else {
      loadData();
    }
  }

  async function handleReject(subId: number) {
    setProcessingId(subId);
    setActionError(null);
    const res = await rejectSubscription(subId);
    setProcessingId(null);
    if (!res.success) {
      setActionError(res.error || 'Failed to reject subscription.');
    } else {
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[12px] font-medium text-zinc-400 mb-1">
            Investor management
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-50 text-balance">
            Investors, KYC &amp; cap table
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl text-pretty">
            Onboard institutional and accredited investors, manage KYC
            eligibility, settle primary subscriptions onto Solana Token-2022
            ATAs, and audit reconciled ownership.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/docs"
            className="h-9 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <span>/api/v1/investors</span>
            <ExternalLink className="size-3 text-zinc-500" />
          </Link>
          <button
            type="button"
            onClick={() => setShowOnboardForm(!showOnboardForm)}
            className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Onboard investor</span>
          </button>
        </div>
      </div>

      {/* Onboard Investor Form Panel */}
      {showOnboardForm && (
        <form
          onSubmit={handleOnboardInvestor}
          className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Onboard new investor
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Registers an investor profile in your organization workspace
                (also available via{' '}
                <code className="font-mono text-zinc-300">
                  POST /api/v1/investors
                </code>
                ).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOnboardForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Legal name / entity
              </label>
              <input
                type="text"
                required
                value={newInvestor.name}
                onChange={(e) =>
                  setNewInvestor({ ...newInvestor, name: e.target.value })
                }
                placeholder="Apex Institutional Partners LP"
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Investor email
              </label>
              <input
                type="email"
                required
                value={newInvestor.email}
                onChange={(e) =>
                  setNewInvestor({ ...newInvestor, email: e.target.value })
                }
                placeholder="treasury@apex-lp.io"
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Solana wallet address (optional)
              </label>
              <input
                type="text"
                value={newInvestor.walletAddress}
                onChange={(e) =>
                  setNewInvestor({
                    ...newInvestor,
                    walletAddress: e.target.value,
                  })
                }
                placeholder="GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T..."
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Classification
              </label>
              <select
                value={newInvestor.investorType}
                onChange={(e) =>
                  setNewInvestor({
                    ...newInvestor,
                    investorType: e.target.value,
                  })
                }
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="accredited">Accredited Investor</option>
                <option value="institutional">Institutional / Fund</option>
                <option value="qualified_purchaser">Qualified Purchaser</option>
                <option value="individual">Individual / Retail</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Jurisdiction (ISO)
              </label>
              <input
                type="text"
                maxLength={5}
                value={newInvestor.jurisdiction}
                onChange={(e) =>
                  setNewInvestor({
                    ...newInvestor,
                    jurisdiction: e.target.value,
                  })
                }
                placeholder="US, UK, SG, CH..."
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono uppercase text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-300">
                Initial KYC status
              </label>
              <select
                value={newInvestor.kycStatus}
                onChange={(e) =>
                  setNewInvestor({ ...newInvestor, kycStatus: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="approved">Approved (Whitelisted)</option>
                <option value="pending">Pending KYC Review</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowOnboardForm(false)}
              className="h-9 px-4 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingInvestor}
              className="h-9 px-5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium disabled:opacity-50 cursor-pointer"
            >
              {submittingInvestor
                ? 'Saving profile...'
                : 'Save & onboard investor'}
            </button>
          </div>
        </form>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Registered investors</span>
            <span className="text-zinc-300 font-mono text-[11px]">
              {approvedKycCount} verified
            </span>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {investorProfiles.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Whitelisted &amp; tracked profiles
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Settled capital</span>
            <span className="font-mono text-[11px] text-zinc-500">USD</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            $
            {totalSettledCapital.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {settledSubscriptions.length} settled allocations
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Pending settlement</span>
            {pendingSubscriptions.length > 0 && (
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {pendingSubscriptions.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Awaiting Solana ATA delivery
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Tokens allocated</span>
            <Coins className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {totalTokensAllocated.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            SPL Token-2022 units on Devnet
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20 text-red-400 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-1">
          {[
            {
              id: 'registry',
              label: 'Investor registry & KYC',
              count: investorProfiles.length,
            },
            {
              id: 'subscriptions',
              label: 'Pending subscriptions',
              count: pendingSubscriptions.length,
              highlight: pendingSubscriptions.length > 0,
            },
            {
              id: 'captable',
              label: 'Reconciled cap table',
              count: settledSubscriptions.length,
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-xs border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'border-zinc-100 text-zinc-50 font-medium'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                    tab.highlight
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'registry' && (
          <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
            <Search className="size-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, email, wallet..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}
      </div>

      {/* TAB 1: INVESTOR REGISTRY & KYC ELIGIBILITY */}
      {activeTab === 'registry' && (
        <section className="space-y-4">
          {filteredInvestors.length === 0 ? (
            <div className="p-10 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center space-y-3">
              <div className="text-xs font-medium text-zinc-300">
                No investor profiles yet
              </div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto text-pretty">
                Onboard your first accredited or institutional investor using
                the button above or via{' '}
                <code className="font-mono text-zinc-300">
                  POST /api/v1/investors
                </code>
                .
              </p>
              <button
                type="button"
                onClick={() => setShowOnboardForm(true)}
                className="h-8 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Onboard first investor</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/80 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-[11px] font-medium text-zinc-400">
                    <th className="py-3 px-4">Investor</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Solana wallet</th>
                    <th className="py-3 px-4">KYC status</th>
                    <th className="py-3 px-4 text-right">Settled capital</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {filteredInvestors.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-900/30">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-100">
                          {inv.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {inv.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {inv.investorType.replace('_', ' ')}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-zinc-500">
                          {inv.jurisdiction}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {inv.walletAddress ? (
                          <span title={inv.walletAddress}>
                            {inv.walletAddress.slice(0, 6)}...
                            {inv.walletAddress.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Not linked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] capitalize px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-200">
                          <span
                            className={`size-1.5 rounded-full ${
                              inv.kycStatus === 'approved'
                                ? 'bg-zinc-100'
                                : inv.kycStatus === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                          />
                          {inv.kycStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-200">
                        $
                        {inv.totalInvestedUsd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                        {inv.totalTokens > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            {inv.totalTokens.toLocaleString()} tokens
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {inv.kycStatus !== 'approved' && (
                            <button
                              type="button"
                              disabled={updatingKycId === inv.id}
                              onClick={() =>
                                handleKycChange(inv.id, 'approved')
                              }
                              className="h-7 px-2.5 rounded-md bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Approve KYC
                            </button>
                          )}
                          {inv.kycStatus !== 'rejected' && (
                            <button
                              type="button"
                              disabled={updatingKycId === inv.id}
                              onClick={() =>
                                handleKycChange(inv.id, 'rejected')
                              }
                              className="h-7 px-2.5 rounded-md border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PENDING SUBSCRIPTIONS QUEUE */}
      {activeTab === 'subscriptions' && (
        <section className="space-y-4">
          {pendingSubscriptions.length === 0 ? (
            <div className="p-10 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center space-y-2">
              <div className="text-xs font-medium text-zinc-300">
                No pending subscriptions
              </div>
              <p className="text-xs text-zinc-500">
                All investor subscription requests have been settled.
                Prospective investors can subscribe via the{' '}
                <Link
                  href="/explore"
                  className="text-zinc-200 underline hover:text-white"
                >
                  Marketplace
                </Link>{' '}
                or{' '}
                <code className="font-mono text-zinc-300">
                  POST /api/v1/offerings/:id/subscriptions
                </code>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-100">
                        {sub.offeringName}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        ${sub.tokenSymbol}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-400">
                        Pending settlement
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Investor:{' '}
                      <span className="text-zinc-200">
                        {sub.user?.email || sub.userId}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono break-all">
                      Destination wallet:{' '}
                      <span className="text-zinc-300">{sub.investorWallet}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-medium text-zinc-100 tabular-nums">
                        $
                        {Number(sub.amountUsd).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 tabular-nums">
                        {Number(sub.tokenQuantity).toLocaleString()}{' '}
                        {sub.tokenSymbol} tokens
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(sub.id)}
                        disabled={processingId === sub.id}
                        className="h-9 px-3 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettle(sub.id)}
                        disabled={processingId === sub.id}
                        className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {processingId === sub.id
                          ? 'Minting on Solana...'
                          : 'Approve & allocate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: RECONCILED ON-CHAIN CAP TABLE */}
      {activeTab === 'captable' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-zinc-400">
              On-chain Token-2022 Associated Token Account (ATA) allocations
              reconciled against platform subscription records.
            </p>

            <select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="h-8 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All offerings ({offerings.length})</option>
              {offerings.map((off) => (
                <option key={off.id} value={String(off.id)}>
                  {off.name} (${off.tokenSymbol || 'TOKEN'})
                </option>
              ))}
            </select>
          </div>

          {settledSubscriptions.length === 0 ? (
            <div className="p-10 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center space-y-2">
              <div className="text-xs font-medium text-zinc-300">
                Empty cap table
              </div>
              <p className="text-xs text-zinc-500">
                No settled token allocations yet. Approve a pending subscription
                to transfer Token-2022 units to an investor wallet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/80 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-[11px] font-medium text-zinc-400">
                    <th className="py-3 px-4">Investor / wallet</th>
                    <th className="py-3 px-4">Offering</th>
                    <th className="py-3 px-4 text-right">Tokens held</th>
                    <th className="py-3 px-4 text-right">Supply share</th>
                    <th className="py-3 px-4 text-right">Capital settled</th>
                    <th className="py-3 px-4 text-right">Solana proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {settledSubscriptions.map((sub) => {
                    const sharePct =
                      sub.tokenSupply > 0
                        ? (
                            (Number(sub.tokenQuantity) / sub.tokenSupply) *
                            100
                          ).toFixed(2)
                        : null;

                    return (
                      <tr key={sub.id} className="hover:bg-zinc-900/30">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-zinc-200">
                            {sub.user?.email || 'Verified Investor'}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500 truncate max-w-[220px]">
                            {sub.investorWallet}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-zinc-200">
                            {sub.offeringName}
                          </span>
                          <span className="ml-1.5 font-mono text-[10px] text-zinc-400">
                            ${sub.tokenSymbol}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-100">
                          {Number(sub.tokenQuantity).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-400">
                          {sharePct ? `${sharePct}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-200">
                          $
                          {Number(sub.amountUsd).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {sub.txSignature ? (
                            <a
                              href={`https://explorer.solana.com/tx/${sub.txSignature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300 hover:text-white underline underline-offset-4"
                            >
                              <span>{sub.txSignature.slice(0, 8)}...</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="font-mono text-[11px] text-zinc-500">
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
