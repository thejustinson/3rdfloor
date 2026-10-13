'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { getExploreOffering, createSubscription } from '../../actions';

export default function ExploreOfferingDetailPage({
  params,
}: {
  params: Promise<{ offeringId: string }>;
}) {
  const { offeringId } = use(params);
  const { user } = usePrivy();
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Subscription state
  const [subscribing, setSubscribing] = useState(false);
  const [subAmount, setSubAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [subSuccess, setSubSuccess] = useState<number | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  useEffect(() => {
    getExploreOffering(parseInt(offeringId)).then((res) => {
      setOffering(res);
      setLoading(false);
    });
  }, [offeringId]);

  useEffect(() => {
    if (user?.wallet?.address) {
      setWalletAddress(user.wallet.address);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="text-sm font-mono text-zinc-500 animate-pulse">
        [FETCHING_OFFERING_DETAILS]...
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="p-8 border border-zinc-800 bg-zinc-900/30 text-center rounded">
        <div className="font-mono text-sm text-zinc-400 mb-2">[404_OFFERING_NOT_FOUND]</div>
        <Link href="/explore" className="text-xs text-zinc-500 hover:text-zinc-300 underline">
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  const token = offering.tokens?.[0];
  const tokenPrice = offering.tokenPrice ? Number(offering.tokenPrice) : null;
  const targetRaise = offering.targetRaise ? Number(offering.targetRaise) : null;
  const tokenSupply = offering.tokenSupply ? Number(offering.tokenSupply) : null;

  // Calculate tokens for entered USD amount
  const calculatedTokens =
    subAmount && tokenPrice && tokenPrice > 0
      ? Math.floor(Number(subAmount) / tokenPrice)
      : null;

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!subAmount || Number(subAmount) <= 0) {
      setSubError('Please enter a valid investment amount.');
      return;
    }
    if (!walletAddress) {
      setSubError('Please provide a destination Solana wallet address.');
      return;
    }

    setSubscribing(true);
    setSubError(null);

    const tokenQty = calculatedTokens ? calculatedTokens.toString() : '0';

    const res = await createSubscription(
      offering.id,
      user.id,
      walletAddress,
      subAmount,
      tokenQty,
      user.email?.address
    );

    setSubscribing(false);
    if (res.success && res.subscriptionId) {
      setSubSuccess(res.subscriptionId);
    } else {
      setSubError(res.error || 'Failed to submit subscription.');
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Status */}
      <div>
        <Link
          href="/explore"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1.5 transition-colors"
        >
          &larr; EXPLORE CATALOG
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {offering.asset?.category?.replace('_', ' ') || 'ASSET'}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                  offering.status === 'approved' || offering.status === 'open'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {offering.status}
              </span>
              {token && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900/50 text-emerald-400">
                  TOKEN-2022 VERIFIED
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 text-balance">
                {offering.name}
              </h1>
              {offering.tokenSymbol && (
                <span className="font-mono text-sm text-zinc-400 font-semibold">
                  ${offering.tokenSymbol}
                </span>
              )}
            </div>

            {offering.organization && (
              <p className="text-sm text-zinc-400 mt-1">
                Issued by{' '}
                <span className="text-zinc-200 font-medium">{offering.organization.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Asset Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description & Terms */}
          <section className="border border-zinc-800/80 bg-zinc-900/20 p-6 rounded space-y-4">
            <h2 className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
              Offering Terms & Description
            </h2>
            <div
              className="prose prose-invert prose-sm prose-zinc text-zinc-300 max-w-none text-pretty"
              dangerouslySetInnerHTML={{
                __html: offering.description || '<p>No description provided.</p>',
              }}
            />
          </section>

          {/* Underlying Asset Information */}
          {offering.asset && (
            <section className="border border-zinc-800/80 bg-zinc-900/20 p-6 rounded space-y-4">
              <h2 className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                Underlying Asset Overview
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Asset Name</div>
                  <div className="text-zinc-200 font-medium">{offering.asset.name}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Category</div>
                  <div className="text-zinc-200 font-medium uppercase font-mono text-xs">
                    {offering.asset.category}
                  </div>
                </div>

                {offering.asset.declaredValuation && (
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">
                      Declared Valuation
                    </div>
                    <div className="text-zinc-200 font-medium tabular-nums">
                      ${Number(offering.asset.declaredValuation).toLocaleString()}
                    </div>
                  </div>
                )}

                {offering.asset.legalOwner && (
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Legal Owner</div>
                    <div className="text-zinc-200 font-medium">{offering.asset.legalOwner}</div>
                  </div>
                )}
              </div>

              {offering.asset.description && (
                <div className="pt-2 text-xs text-zinc-400 text-pretty">
                  {offering.asset.description}
                </div>
              )}
            </section>
          )}

          {/* Onchain Specifications */}
          {token && (
            <section className="border border-zinc-800/80 bg-zinc-900/20 p-6 rounded space-y-4">
              <h2 className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                Onchain Solana Specifications
              </h2>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Mint Address</div>
                  <div className="text-xs font-mono text-emerald-400 break-all bg-emerald-950/20 p-2.5 border border-emerald-900/40 rounded mt-1">
                    {token.mintAddress}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2">
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Program Standard</span>
                    <span className="text-zinc-200 font-medium">Solana Token-2022</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Decimals</span>
                    <span className="text-zinc-200 font-medium tabular-nums">{token.decimals || 0}</span>
                  </div>
                </div>

                {token.mintAuthority && (
                  <div className="pt-2">
                    <span className="text-zinc-500 block uppercase text-[10px] font-mono">
                      Mint Authority
                    </span>
                    <span className="text-xs font-mono text-zinc-400 break-all">
                      {token.mintAuthority}
                    </span>
                  </div>
                )}

                <div className="pt-3">
                  <a
                    href={`https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
                  >
                    View on Solana Explorer &rarr;
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Investment / Subscription Card */}
        <div className="space-y-6">
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 rounded space-y-6">
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                INVESTMENT SUMMARY
              </div>
              <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
                {targetRaise ? `$${targetRaise.toLocaleString()}` : 'TBD'}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">Target Capital Raise</div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Token Price</span>
                <span className="font-mono text-zinc-200 font-medium tabular-nums">
                  {tokenPrice ? `$${tokenPrice.toFixed(2)}` : 'TBD'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total Supply</span>
                <span className="font-mono text-zinc-200 font-medium tabular-nums">
                  {tokenSupply ? tokenSupply.toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Standard</span>
                <span className="font-mono text-zinc-200 text-xs">
                  {offering.tokenStandard}
                </span>
              </div>
            </div>

            {/* Subscription Form */}
            <div className="pt-6 border-t border-zinc-800">
              {subSuccess ? (
                <div className="p-4 border border-emerald-900/50 bg-emerald-950/20 rounded text-center space-y-2">
                  <div className="text-xs font-mono text-emerald-400 font-medium">
                    [SUBSCRIPTION_RECORDED]
                  </div>
                  <p className="text-xs text-zinc-300">
                    Your subscription of <span className="font-medium text-emerald-400">${subAmount}</span>{' '}
                    has been recorded successfully!
                  </p>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Subscription ID: #{subSuccess}
                  </div>
                  <button
                    onClick={() => {
                      setSubSuccess(null);
                      setSubAmount('');
                    }}
                    className="text-xs text-zinc-400 underline hover:text-zinc-200 pt-2 block mx-auto"
                  >
                    Submit another subscription
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="subAmount"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Investment Amount (USD)
                    </label>
                    <input
                      type="number"
                      id="subAmount"
                      value={subAmount}
                      onChange={(e) => setSubAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      min="1"
                      step="any"
                      required
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors text-sm tabular-nums"
                    />
                    {calculatedTokens !== null && (
                      <p className="text-[11px] font-mono text-zinc-400">
                        &asymp; {calculatedTokens.toLocaleString()} tokens
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="walletAddress"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Destination Solana Wallet
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Solana address for token delivery"
                      required
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors text-xs font-mono"
                    />
                  </div>

                  {subError && (
                    <div className="p-2.5 border border-red-900/50 bg-red-950/20 text-red-400 text-xs rounded">
                      {subError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={subscribing || offering.status === 'closed'}
                    className="h-10 w-full bg-zinc-50 text-zinc-950 text-sm font-medium rounded transition-transform active:scale-[0.98] hover:bg-zinc-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {subscribing ? 'Submitting...' : 'Subscribe / Invest'}
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center">
                    Subscriptions are subject to issuer approval and eligibility verification.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
