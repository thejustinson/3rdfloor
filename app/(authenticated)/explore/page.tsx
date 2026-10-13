'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getExploreOfferings } from '../actions';
import { Search } from '@/components/docs-icons';

export default function ExplorePage() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getExploreOfferings().then((res) => {
      setOfferings(res);
      setLoading(false);
    });
  }, []);

  const filteredOfferings = offerings.filter((offering) => {
    if (
      filter === 'approved' &&
      offering.status !== 'approved' &&
      offering.status !== 'open'
    ) {
      return false;
    }
    if (
      filter === 'draft' &&
      offering.status !== 'draft' &&
      offering.status !== 'under_review'
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        offering.name?.toLowerCase().includes(q) ||
        offering.tokenSymbol?.toLowerCase().includes(q) ||
        offering.asset?.category?.toLowerCase().includes(q) ||
        offering.organization?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[12px] font-medium text-zinc-400 mb-1">
            Primary marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-50 text-balance">
            Explore tokenized offerings
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-pretty">
            Browse institutional and fractionalized real-world assets deployed
            on Solana via SPL Token-2022.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <Search className="size-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, issuer, asset..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-zinc-900/80 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({offerings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('approved')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                filter === 'approved'
                  ? 'bg-zinc-800 text-zinc-50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Open (
              {
                offerings.filter(
                  (o) => o.status === 'approved' || o.status === 'open'
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setFilter('draft')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                filter === 'draft'
                  ? 'bg-zinc-800 text-zinc-50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upcoming (
              {
                offerings.filter(
                  (o) => o.status === 'draft' || o.status === 'under_review'
                ).length
              }
              )
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse"
            />
          ))}
        </div>
      ) : filteredOfferings.length === 0 ? (
        <div className="p-12 rounded-xl text-center border border-zinc-800/80 bg-zinc-900/15">
          <div className="text-xs font-medium text-zinc-300 mb-1">
            No matching offerings
          </div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No offerings match the current filter. Create an offering in your
            issuer workspace or clear your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOfferings.map((offering) => {
            const mintRecord = offering.tokens?.[0];
            const hasMint = Boolean(mintRecord?.mintAddress);
            const targetRaise = offering.targetRaise
              ? Number(offering.targetRaise)
              : null;
            const tokenPrice = offering.tokenPrice
              ? Number(offering.tokenPrice)
              : null;
            const tokenSupply = offering.tokenSupply
              ? Number(offering.tokenSupply)
              : 0;

            const settledSubs = (offering.subscriptions || []).filter(
              (s: any) => s.status === 'settled'
            );
            const allocatedTokens = settledSubs.reduce(
              (sum: number, s: any) => sum + Number(s.tokenQuantity || 0),
              0
            );
            const allocatedPct =
              tokenSupply > 0
                ? Math.min(100, (allocatedTokens / tokenSupply) * 100)
                : 0;

            return (
              <Link
                key={offering.id}
                href={`/explore/${offering.id}`}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40 p-6 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {offering.asset?.category?.replace('_', ' ') ||
                        'Real World Asset'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasMint && (
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200">
                          Token-2022
                        </span>
                      )}
                      <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
                        {offering.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">
                        {offering.name}
                      </h3>
                      {offering.tokenSymbol && (
                        <span className="font-mono text-xs text-zinc-300 font-medium">
                          ${offering.tokenSymbol}
                        </span>
                      )}
                    </div>
                    {offering.organization && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Issued by {offering.organization.name}
                      </p>
                    )}
                  </div>

                  {/* Allocation Progress Bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] mb-1.5 tabular-nums">
                      <span className="text-zinc-500">Primary allocation</span>
                      <span className="text-zinc-300 font-mono">
                        {allocatedPct.toFixed(1)}% ({allocatedTokens.toLocaleString()}{' '}
                        / {tokenSupply ? tokenSupply.toLocaleString() : '—'})
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-100 transition-all"
                        style={{ width: `${allocatedPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Financial Metrics */}
                <div className="pt-5 mt-5 border-t border-zinc-800/70 grid grid-cols-3 gap-2 text-left">
                  <div>
                    <div className="text-[11px] text-zinc-500">Target raise</div>
                    <div className="text-xs font-semibold text-zinc-100 tabular-nums mt-0.5">
                      {targetRaise ? `$${targetRaise.toLocaleString()}` : 'TBD'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Unit price</div>
                    <div className="text-xs font-semibold text-zinc-100 tabular-nums mt-0.5">
                      {tokenPrice ? `$${tokenPrice.toFixed(2)}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Declared NAV</div>
                    <div className="text-xs font-semibold text-zinc-200 tabular-nums mt-0.5">
                      {offering.asset?.declaredValuation
                        ? `$${Number(
                            offering.asset.declaredValuation
                          ).toLocaleString()}`
                        : '—'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
