'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  getOffering,
  settleSubscription,
  rejectSubscription,
  createDistribution,
  updateOfferingLifecycleStatus,
} from '../../../../actions';

export default function OfferingDetailPage({
  params,
}: {
  params: Promise<{ id: string; offeringId: string }>;
}) {
  const { id, offeringId } = use(params);
  const orgIdNum = parseInt(id, 10);
  const offeringIdNum = parseInt(offeringId, 10);

  const { user } = usePrivy();
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Action states
  const [processingSubId, setProcessingSubId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  // Distribution form states
  const [distTitle, setDistTitle] = useState('');
  const [distAmount, setDistAmount] = useState('');
  const [creatingDist, setCreatingDist] = useState(false);

  const loadOffering = () => {
    setLoading(true);
    getOffering(offeringIdNum, orgIdNum).then((res) => {
      setOffering(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.id) {
      loadOffering();
    }
  }, [user, id, offeringId]);

  if (loading) {
    return (
      <div className="text-sm font-mono text-zinc-500 animate-pulse">
        [FETCHING_OFFERING]...
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="p-12 border border-zinc-800 border-dashed text-center">
        <h3 className="text-lg font-medium text-zinc-200 mb-1">
          Offering not found
        </h3>
        <p className="text-sm text-zinc-500 mb-6">
          The offering you are looking for does not exist or you don&apos;t have access to it.
        </p>
        <Link
          href={`/org/${id}/offerings`}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200"
        >
          &larr; BACK TO OFFERINGS
        </Link>
      </div>
    );
  }

  const subs: any[] = offering.subscriptions || [];
  const pendingSubs = subs.filter((s) => s.status === 'pending');
  const settledSubs = subs.filter((s) => s.status === 'settled');
  const distributionsList: any[] = offering.distributions || [];

  const settledCapital = settledSubs.reduce(
    (sum, s) => sum + Number(s.amountUsd || 0),
    0
  );
  const allocatedTokens = settledSubs.reduce(
    (sum, s) => sum + Number(s.tokenQuantity || 0),
    0
  );

  const targetRaiseNum = Number(offering.targetRaise || 0);
  const totalSupplyNum = Number(offering.tokenSupply || 0);
  const raisePct =
    targetRaiseNum > 0
      ? Math.min(100, (settledCapital / targetRaiseNum) * 100)
      : 0;

  async function handleSettle(subId: number) {
    setProcessingSubId(subId);
    setActionError(null);
    const res = await settleSubscription(subId);
    setProcessingSubId(null);
    if (!res.success) {
      setActionError(res.error || 'Failed to allocate tokens.');
    } else {
      loadOffering();
    }
  }

  async function handleReject(subId: number) {
    setProcessingSubId(subId);
    setActionError(null);
    const res = await rejectSubscription(subId);
    setProcessingSubId(null);
    if (!res.success) {
      setActionError(res.error || 'Failed to reject subscription.');
    } else {
      loadOffering();
    }
  }

  async function handleStatusChange(
    newStatus: 'open' | 'paused' | 'closed' | 'approved'
  ) {
    setStatusUpdating(true);
    setActionError(null);
    const res = await updateOfferingLifecycleStatus(
      offeringIdNum,
      orgIdNum,
      newStatus
    );
    setStatusUpdating(false);
    setConfirmCloseOpen(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to update status.');
    } else {
      loadOffering();
    }
  }

  async function handleCreateDistribution(e: React.FormEvent) {
    e.preventDefault();
    if (!distTitle || !distAmount || Number(distAmount) <= 0) return;
    setCreatingDist(true);
    setActionError(null);
    const res = await createDistribution(
      offeringIdNum,
      orgIdNum,
      distTitle,
      distAmount
    );
    setCreatingDist(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to execute distribution.');
    } else {
      setDistTitle('');
      setDistAmount('');
      loadOffering();
    }
  }

  return (
    <div className="max-w-4xl space-y-10">
      {/* Header & Lifecycle Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <Link
            href={`/org/${id}/offerings`}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
          >
            &larr; BACK TO OFFERINGS
          </Link>
          <h1 className="text-2xl font-medium text-zinc-50 mt-4 text-balance">
            {offering.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xs text-zinc-400">
              Backed by:{' '}
              <Link
                href={`/org/${id}/assets/${offering.assetId}`}
                className="text-zinc-300 hover:underline"
              >
                {offering.asset?.name || `Asset #${offering.assetId}`}
              </Link>
            </span>
            <span className="size-1 rounded-full bg-zinc-700"></span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                offering.status === 'approved' || offering.status === 'open'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                  : offering.status === 'closed'
                  ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {offering.status}
            </span>
            <Link
              href={`/explore/${offering.id}`}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline ml-2"
            >
              View Investor Page &rarr;
            </Link>
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(offering.status === 'approved' || offering.status === 'paused') && (
            <button
              onClick={() => handleStatusChange('open')}
              disabled={statusUpdating}
              className="h-8 px-3 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Open Offering
            </button>
          )}
          {offering.status === 'open' && (
            <button
              onClick={() => handleStatusChange('paused')}
              disabled={statusUpdating}
              className="h-8 px-3 border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Pause Subscriptions
            </button>
          )}
          {offering.status !== 'closed' && offering.status !== 'draft' && (
            <button
              onClick={() => setConfirmCloseOpen(true)}
              disabled={statusUpdating}
              className="h-8 px-3 border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Close Offering
            </button>
          )}
        </div>
      </div>

      {/* Destructive Closure Confirmation Dialog */}
      {confirmCloseOpen && (
        <div
          role="alertdialog"
          aria-labelledby="close-offering-title"
          aria-describedby="close-offering-desc"
          className="p-5 border border-red-900/60 bg-red-950/20 space-y-4"
        >
          <div>
            <h3
              id="close-offering-title"
              className="text-sm font-medium text-red-400"
            >
              Confirm Offering Closure
            </h3>
            <p id="close-offering-desc" className="text-xs text-zinc-300 mt-1">
              Closing this offering will permanently halt new investor subscriptions. Existing token holders and distributions will remain accessible.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStatusChange('closed')}
              disabled={statusUpdating}
              className="h-8 px-4 bg-red-600 text-zinc-50 hover:bg-red-500 text-xs font-medium"
            >
              {statusUpdating ? 'Closing...' : 'Confirm Close Offering'}
            </button>
            <button
              onClick={() => setConfirmCloseOpen(false)}
              className="h-8 px-3 border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-4 border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-mono">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="md:col-span-2 space-y-10">
          {/* Fundraising Progress */}
          <section className="p-5 border border-zinc-800 bg-zinc-900/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-zinc-500 uppercase">
                FUNDRAISING_AND_ALLOCATION_PROGRESS
              </div>
              <div className="text-xs font-mono text-emerald-400 tabular-nums">
                {raisePct.toFixed(1)}% FUNDED
              </div>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${raisePct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase">
                  Settled Capital
                </div>
                <div className="text-sm font-medium text-zinc-100 tabular-nums mt-0.5">
                  ${settledCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase">
                  Allocated Tokens
                </div>
                <div className="text-sm font-medium text-zinc-100 tabular-nums mt-0.5">
                  {allocatedTokens.toLocaleString()} /{' '}
                  {totalSupplyNum ? totalSupplyNum.toLocaleString() : '∞'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase">
                  Pending Requests
                </div>
                <div className="text-sm font-medium text-zinc-100 tabular-nums mt-0.5">
                  {pendingSubs.length}
                </div>
              </div>
            </div>
          </section>

          {/* Description & Terms */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">
              Description &amp; Terms
            </h2>
            <div
              className="prose prose-invert prose-sm prose-zinc text-zinc-400 max-w-none text-pretty"
              dangerouslySetInnerHTML={{
                __html: offering.description || 'No description provided.',
              }}
            />
          </section>

          {/* Subscriptions & Cap Table for this Offering */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-medium text-zinc-200">
                Investor Subscriptions &amp; Ownership ({subs.length})
              </h2>
              <Link
                href={`/org/${id}/investors`}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                Full Registry &rarr;
              </Link>
            </div>

            {subs.length === 0 ? (
              <div className="p-6 border border-zinc-800 border-dashed text-xs font-mono text-zinc-500 text-center">
                [NO_SUBSCRIPTIONS_FOR_THIS_OFFERING]
              </div>
            ) : (
              <div className="space-y-3">
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 border border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">
                          {sub.user?.email || 'Investor'}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            sub.status === 'settled'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                              : sub.status === 'rejected'
                              ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                              : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500 break-all">
                        Wallet: {sub.investorWallet}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-zinc-100 font-medium">
                          ${Number(sub.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-emerald-400">
                          {Number(sub.tokenQuantity).toLocaleString()}{' '}
                          {offering.tokenSymbol || 'Tokens'}
                        </div>
                      </div>

                      {sub.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(sub.id)}
                            disabled={processingSubId === sub.id}
                            className="h-8 px-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleSettle(sub.id)}
                            disabled={processingSubId === sub.id}
                            className="h-8 px-3 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 text-xs font-medium disabled:opacity-50"
                          >
                            {processingSubId === sub.id
                              ? 'Allocating...'
                              : 'Allocate Tokens'}
                          </button>
                        </div>
                      )}

                      {sub.status === 'settled' && sub.transactionSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${sub.transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Tx &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Distributions Module */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">
              Distributions &amp; Yield Payouts
            </h2>

            <form
              onSubmit={handleCreateDistribution}
              className="p-5 border border-zinc-800 bg-zinc-900/20 space-y-4"
            >
              <div className="text-xs font-mono text-zinc-400 uppercase">
                DECLARE NEW DISTRIBUTION TO TOKEN HOLDERS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="distTitle"
                    className="block text-xs text-zinc-400"
                  >
                    Distribution Title / Period
                  </label>
                  <input
                    id="distTitle"
                    type="text"
                    value={distTitle}
                    onChange={(e) => setDistTitle(e.target.value)}
                    placeholder="e.g. Q4 2026 Dividend Payout"
                    required
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="distAmount"
                    className="block text-xs text-zinc-400"
                  >
                    Total Distribution Pool (USD)
                  </label>
                  <input
                    id="distAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {distAmount && Number(distAmount) > 0 && settledSubs.length > 0 && (
                <div className="p-3 border border-zinc-800 bg-zinc-950/60 text-xs space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">
                    PRO-RATA ENTITLEMENT PREVIEW ({settledSubs.length} SETTLED HOLDERS)
                  </div>
                  {settledSubs.slice(0, 3).map((s) => {
                    const share =
                      totalSupplyNum > 0
                        ? Number(s.tokenQuantity) / totalSupplyNum
                        : 0;
                    const payout = Number(distAmount) * share;
                    return (
                      <div
                        key={s.id}
                        className="flex justify-between font-mono text-[11px]"
                      >
                        <span className="text-zinc-400 truncate max-w-[220px]">
                          {s.investorWallet}
                        </span>
                        <span className="text-emerald-400 tabular-nums">
                          +${payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({(share * 100).toFixed(2)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingDist}
                className="h-9 px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 text-xs font-medium disabled:opacity-50"
              >
                {creatingDist
                  ? 'Recording Distribution...'
                  : 'Execute & Record Distribution'}
              </button>
            </form>

            {distributionsList.length > 0 && (
              <div className="space-y-2 pt-2">
                {distributionsList.map((dist) => (
                  <div
                    key={dist.id}
                    className="p-4 border border-zinc-800 bg-zinc-900/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">
                        {dist.title}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        Executed {new Date(dist.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-emerald-400 font-medium">
                        ${Number(dist.totalAmountUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase">
                        {dist.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Specifications */}
        <div className="space-y-6">
          <section className="p-5 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs font-mono text-zinc-500 mb-2">
              TARGET_RAISE
            </div>
            <div className="text-xl font-medium tabular-nums text-zinc-200">
              {offering.targetRaise
                ? `$${Number(offering.targetRaise).toLocaleString()}`
                : 'TBD'}
            </div>
          </section>

          <section className="p-5 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs font-mono text-zinc-500 mb-2">
              TOKENOMICS
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Standard</span>
                <span className="text-zinc-200 font-medium">
                  {offering.tokenStandard}
                </span>
              </div>
              {offering.tokenSymbol && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ticker</span>
                  <span className="text-zinc-200 font-mono font-medium">
                    {offering.tokenSymbol}
                  </span>
                </div>
              )}
              {offering.tokenName && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Token Name</span>
                  <span className="text-zinc-200">{offering.tokenName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Supply</span>
                <span className="text-zinc-200 font-mono tabular-nums">
                  {offering.tokenSupply
                    ? Number(offering.tokenSupply).toLocaleString()
                    : 'Not configured'}
                </span>
              </div>
              {offering.tokenPrice && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Price / Token</span>
                  <span className="text-zinc-200 font-mono tabular-nums">
                    ${Number(offering.tokenPrice).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="p-5 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs font-mono text-zinc-500 mb-2">METADATA</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Offering ID</span>
                <span className="text-zinc-300 font-mono tabular-nums">
                  {offering.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-300 font-mono tabular-nums">
                  {new Date(offering.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </section>

          {offering.tokens && offering.tokens.length > 0 && (
            <section className="p-5 border border-zinc-800 bg-zinc-900/30">
              <div className="text-xs font-mono text-zinc-500 mb-2">
                ONCHAIN_TOKEN
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">
                    Mint Address
                  </div>
                  <div className="text-xs font-mono text-emerald-400 break-all bg-emerald-950/20 p-2 border border-emerald-900/30 rounded">
                    {offering.tokens[0].mintAddress}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">
                    Status
                  </div>
                  <div className="text-xs font-mono text-zinc-300 uppercase">
                    {offering.tokens[0].status}
                  </div>
                </div>
                {offering.tokens[0].initialSupply && (
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">
                      Minted Supply
                    </div>
                    <div className="text-xs font-mono text-zinc-300 tabular-nums">
                      {Number(offering.tokens[0].initialSupply).toLocaleString()}
                    </div>
                  </div>
                )}
                {offering.tokens[0].mintAuthority && (
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">
                      Mint Authority
                    </div>
                    <div className="text-xs font-mono text-zinc-400 break-all">
                      {offering.tokens[0].mintAuthority}
                    </div>
                  </div>
                )}
                {offering.tokens[0].freezeAuthority && (
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">
                      Freeze Authority
                    </div>
                    <div className="text-xs font-mono text-zinc-400 break-all">
                      {offering.tokens[0].freezeAuthority}
                    </div>
                  </div>
                )}
                <a
                  href={`https://explorer.solana.com/address/${offering.tokens[0].mintAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1 mt-2 transition-colors"
                >
                  View on Explorer &rarr;
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
