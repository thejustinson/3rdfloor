'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { getUserPortfolio } from '../actions';

export default function PortfolioPage() {
  const { user } = usePrivy();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getUserPortfolio(user.id).then((res) => {
        setSubscriptions(res);
        setLoading(false);
      });
    }
  }, [user]);

  const settledSubs = subscriptions.filter((s) => s.status === 'settled');
  const pendingSubs = subscriptions.filter((s) => s.status === 'pending');

  const settledCapital = settledSubs.reduce(
    (sum, s) => sum + Number(s.amountUsd || 0),
    0
  );
  const pendingCapital = pendingSubs.reduce(
    (sum, s) => sum + Number(s.amountUsd || 0),
    0
  );

  // Calculate pro-rata distribution entitlements across settled holdings
  const distributionEntitlements = settledSubs.flatMap((sub) => {
    const offering = sub.offering;
    if (!offering?.distributions || offering.distributions.length === 0) {
      return [];
    }
    const totalSupply = Number(offering.tokenSupply || 0);
    const heldTokens = Number(sub.tokenQuantity || 0);
    const shareRatio = totalSupply > 0 ? heldTokens / totalSupply : 0;

    return offering.distributions.map((dist: any) => ({
      id: `${dist.id}-${sub.id}`,
      distributionId: dist.id,
      title: dist.title,
      offeringName: offering.name,
      tokenSymbol: offering.tokenSymbol || 'TOKEN',
      totalAmountUsd: Number(dist.totalAmountUsd || 0),
      investorPayoutUsd: Number(dist.totalAmountUsd || 0) * shareRatio,
      sharePct: (shareRatio * 100).toFixed(2),
      createdAt: dist.createdAt,
      status: dist.status,
    }));
  });

  const totalDistributionsEarned = distributionEntitlements.reduce(
    (sum, d) => sum + d.investorPayoutUsd,
    0
  );

  if (loading) {
    return (
      <div className="text-sm font-mono text-zinc-500 animate-pulse">
        [FETCHING_INVESTOR_PORTFOLIO]...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-xs font-mono text-zinc-500 uppercase mb-1">
            INVESTOR_PORTAL // HOLDINGS_AND_ACTIVITY
          </div>
          <h1 className="text-2xl font-medium text-zinc-50 text-balance">
            My Investment Portfolio
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-pretty">
            Track your settled Solana Token-2022 holdings, pending subscriptions, and distribution entitlements.
          </p>
        </div>
        <Link
          href="/explore"
          className="h-9 px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center justify-center transition-transform active:scale-[0.98]"
        >
          Explore Offerings &rarr;
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 border border-zinc-800 bg-zinc-900/30">
          <div className="text-xs font-mono text-zinc-500 mb-2">
            SETTLED_HOLDINGS
          </div>
          <div className="text-2xl font-medium tabular-nums text-emerald-400">
            ${settledCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-900/30">
          <div className="text-xs font-mono text-zinc-500 mb-2">
            PENDING_COMMITMENTS
          </div>
          <div className="text-2xl font-medium tabular-nums text-zinc-100">
            ${pendingCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-900/30">
          <div className="text-xs font-mono text-zinc-500 mb-2">
            ACTIVE_ALLOCATIONS
          </div>
          <div className="text-2xl font-medium tabular-nums text-zinc-100">
            {settledSubs.length}
          </div>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-900/30">
          <div className="text-xs font-mono text-zinc-500 mb-2">
            DISTRIBUTIONS_EARNED
          </div>
          <div className="text-2xl font-medium tabular-nums text-zinc-100">
            ${totalDistributionsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* On-Chain Token Holdings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-sm font-medium text-zinc-200">
            On-Chain Token Holdings ({settledSubs.length})
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            SOLANA DEVNET // TOKEN-2022
          </span>
        </div>

        {settledSubs.length === 0 ? (
          <div className="p-8 border border-zinc-800 bg-zinc-900/20 text-center space-y-3">
            <div className="text-xs font-mono text-zinc-500">
              [NO_SETTLED_HOLDINGS]
            </div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You do not have any settled token holdings yet. Subscribe to an active offering in the catalog and wait for the issuer to allocate your tokens.
            </p>
            <div>
              <Link
                href="/explore"
                className="inline-flex h-8 px-4 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-medium items-center"
              >
                Browse Offerings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settledSubs.map((sub) => {
              const mintAddress = sub.offering?.tokens?.[0]?.mintAddress;
              const symbol = sub.offering?.tokenSymbol || 'TOKEN';
              return (
                <div
                  key={sub.id}
                  className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400">
                        SETTLED ON-CHAIN
                      </span>
                      <span className="text-xs font-mono text-zinc-400 font-semibold">
                        ${symbol}
                      </span>
                    </div>
                    <Link
                      href={`/explore/${sub.offeringId}`}
                      className="text-base font-medium text-zinc-100 hover:text-zinc-50 block"
                    >
                      {sub.offering?.name || 'Offering'}
                    </Link>
                    <div className="text-xs text-zinc-500">
                      Issuer: {sub.offering?.organization?.name || 'Verified Issuer'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80 text-xs">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        Token Balance
                      </div>
                      <div className="text-sm font-mono font-medium text-emerald-400 tabular-nums mt-0.5">
                        {Number(sub.tokenQuantity).toLocaleString()} {symbol}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        Cost Basis
                      </div>
                      <div className="text-sm font-mono font-medium text-zinc-200 tabular-nums mt-0.5">
                        ${Number(sub.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500 truncate max-w-[180px]">
                      Wallet: {sub.investorWallet}
                    </span>
                    <div className="flex items-center gap-3">
                      {mintAddress && (
                        <a
                          href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-200 underline"
                        >
                          Mint
                        </a>
                      )}
                      {sub.transactionSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${sub.transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Tx Proof &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subscription History */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">
          Subscription History ({subscriptions.length})
        </h2>

        {subscriptions.length === 0 ? (
          <div className="p-6 border border-zinc-800 border-dashed text-xs font-mono text-zinc-500 text-center">
            [NO_SUBSCRIPTIONS_RECORDED]
          </div>
        ) : (
          <div className="border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-500 uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Offering</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-right">Tokens</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-900/30">
                    <td className="py-3 px-4 font-mono text-zinc-500">
                      #{sub.id}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/explore/${sub.offeringId}`}
                        className="text-zinc-200 hover:text-zinc-50 font-medium"
                      >
                        {sub.offering?.name || `Offering #${sub.offeringId}`}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-200">
                      ${Number(sub.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-300">
                      {Number(sub.tokenQuantity).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          sub.status === 'settled'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                            : sub.status === 'rejected'
                            ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                            : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-500 tabular-nums">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Distributions & Payout Entitlements */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">
          Distributions &amp; Yield Entitlements ({distributionEntitlements.length})
        </h2>

        {distributionEntitlements.length === 0 ? (
          <div className="p-6 border border-zinc-800 border-dashed text-xs font-mono text-zinc-500 text-center">
            [NO_DISTRIBUTIONS_DECLARED_YET]
          </div>
        ) : (
          <div className="border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-500 uppercase">
                  <th className="py-3 px-4">Distribution</th>
                  <th className="py-3 px-4">Offering</th>
                  <th className="py-3 px-4 text-right">Total Pool</th>
                  <th className="py-3 px-4 text-right">Your Share</th>
                  <th className="py-3 px-4 text-right">Your Entitlement</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {distributionEntitlements.map((dist) => (
                  <tr key={dist.id} className="hover:bg-zinc-900/30">
                    <td className="py-3 px-4 font-medium text-zinc-200">
                      {dist.title}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {dist.offeringName} (${dist.tokenSymbol})
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-400">
                      ${dist.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-300">
                      {dist.sharePct}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400 font-medium">
                      +${dist.investorPayoutUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-500 tabular-nums">
                      {new Date(dist.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
