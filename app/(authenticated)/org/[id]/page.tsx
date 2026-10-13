'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { getDashboardStats } from '../../actions';
import { useOrg } from '../../org-context';
import {
  Coins,
  Layers,
  PieChart,
  Plus,
  KeyRound,
} from '@/components/docs-icons';

type DashboardStats = {
  totalAssets: number;
  activeOfferings: number;
  capitalRaised: number;
  investors: number;
  registeredInvestorsCount?: number;
  recentAssets?: any[];
  recentOfferings?: any[];
} | null;

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = usePrivy();
  const { activeOrg } = useOrg();
  const [stats, setStats] = useState<DashboardStats>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getDashboardStats(user.id, parseInt(id, 10)).then((res) => {
        setStats(res);
        setLoading(false);
      });
    }
  }, [user, id]);

  if (loading) {
    return (
      <div className="space-y-8">
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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[12px] font-medium text-zinc-400 mb-1">
            Issuer workspace &bull; #{id}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-50 text-balance">
            {activeOrg?.name || 'Organization'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-pretty">
            Manage real-world assets, SPL Token-2022 offerings, investor KYC
            registries, and REST API keys for this organization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/org/${id}/investors`}
            className="h-9 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:text-zinc-50 hover:bg-zinc-900 text-xs flex items-center gap-1.5 transition-colors"
          >
            <PieChart className="size-3.5 text-zinc-400" />
            <span>Investors</span>
          </Link>
          <Link
            href={`/org/${id}/assets/new`}
            className="h-9 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:text-zinc-50 hover:bg-zinc-900 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Register asset</span>
          </Link>
          <Link
            href={`/org/${id}/offerings/new`}
            className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Create offering</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Total assets</span>
            <Layers className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.totalAssets || 0}
          </div>
          <Link
            href={`/org/${id}/assets`}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-1"
          >
            View asset catalog &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Active offerings</span>
            <Coins className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.activeOfferings || 0}
          </div>
          <Link
            href={`/org/${id}/offerings`}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-1"
          >
            Manage tokenomics &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Capital settled</span>
            <span className="font-mono text-[11px] text-zinc-500">USD</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            $
            {(stats?.capitalRaised || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <Link
            href={`/org/${id}/investors`}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-1"
          >
            Reconciled cap table &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Investor registry</span>
            <PieChart className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.investors || 0}
          </div>
          <Link
            href={`/org/${id}/investors`}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 mt-1"
          >
            Manage KYC &amp; LPs &rarr;
          </Link>
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Offerings & Assets */}
        <div className="lg:col-span-8 space-y-8">
          {/* Offerings Table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h2 className="text-sm font-semibold text-zinc-100">
                Investment offerings &amp; Token-2022 mints
              </h2>
              <Link
                href={`/org/${id}/offerings`}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                View all &rarr;
              </Link>
            </div>

            {stats?.recentOfferings && stats.recentOfferings.length > 0 ? (
              <div className="rounded-xl border border-zinc-800/80 divide-y divide-zinc-800/80 bg-zinc-900/15 overflow-hidden">
                {stats.recentOfferings.map((offering: any) => {
                  const mint = offering.tokens?.[0]?.mintAddress;
                  return (
                    <Link
                      key={offering.id}
                      href={`/org/${id}/offerings/${offering.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-100">
                            {offering.name}
                          </span>
                          {offering.tokenSymbol && (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                              ${offering.tokenSymbol}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                          Target raise: $
                          {Number(offering.targetRaise || 0).toLocaleString()}{' '}
                          &bull; Supply:{' '}
                          {Number(offering.tokenSupply || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {mint && (
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200">
                            Minted
                          </span>
                        )}
                        <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {offering.status.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  No investment offerings drafted yet.
                </p>
                <Link
                  href={`/org/${id}/offerings/new`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white underline underline-offset-4"
                >
                  <span>Configure first Token-2022 offering</span>
                </Link>
              </div>
            )}
          </section>

          {/* Recent Assets Table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h2 className="text-sm font-semibold text-zinc-100">
                Registered real-world assets
              </h2>
              <Link
                href={`/org/${id}/assets`}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                View all &rarr;
              </Link>
            </div>

            {stats?.recentAssets && stats.recentAssets.length > 0 ? (
              <div className="rounded-xl border border-zinc-800/80 divide-y divide-zinc-800/80 bg-zinc-900/15 overflow-hidden">
                {stats.recentAssets.map((asset: any) => (
                  <Link
                    key={asset.id}
                    href={`/org/${id}/assets/${asset.id}`}
                    className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-zinc-100">
                        {asset.name}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                        {asset.category || 'RWA'} &bull; Declared NAV: $
                        {Number(asset.declaredValuation || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {asset.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  No underlying assets registered yet.
                </p>
                <Link
                  href={`/org/${id}/assets/new`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white underline underline-offset-4"
                >
                  <span>Register first asset</span>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns: Compliance & API Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* KYB Compliance Status */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">
                Entity KYB status
              </span>
              <span className="size-2 rounded-full bg-zinc-300" />
            </div>

            {activeOrg?.kybStatus === 'not_started' && (
              <>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Complete KYB verification
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed text-pretty">
                  Submit corporate SPV verification to unlock live Solana
                  Token-2022 mint deployment and public catalog listing.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!user?.id || !activeOrg?.id) return;
                    const { submitKyb } = await import('../../actions');
                    const res = await submitKyb(activeOrg.id, user.id);
                    if (res.success) {
                      window.location.reload();
                    }
                  }}
                  className="h-8 px-3.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium inline-flex items-center cursor-pointer"
                >
                  Submit KYB &rarr;
                </button>
              </>
            )}

            {activeOrg?.kybStatus === 'pending' && (
              <>
                <h3 className="text-sm font-semibold text-zinc-100">
                  KYB verification under review
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed text-pretty">
                  Your entity documentation is being reviewed. You can register
                  assets, onboard investors, and test REST API endpoints while
                  pending.
                </p>
              </>
            )}

            {activeOrg?.kybStatus === 'approved' && (
              <>
                <h3 className="text-sm font-semibold text-zinc-100">
                  KYB verified &amp; active
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed text-pretty">
                  This organization is verified to deploy SPL Token-2022 mints
                  and settle primary investor subscriptions on Solana.
                </p>
              </>
            )}
          </div>

          {/* Headless REST API v1 Card */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">
                REST API v1
              </span>
              <KeyRound className="size-3.5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Automate via secret keys
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed text-pretty">
              Generate a{' '}
              <code className="font-mono text-zinc-200">3f_live_...</code>{' '}
              secret key to onboard investors (
              <code className="font-mono text-zinc-300">/api/v1/investors</code>
              ), deploy offerings, and settle Token-2022 allocations
              programmatically.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Link
                href={`/org/${id}/developers`}
                className="h-8 px-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-100 flex items-center"
              >
                Manage keys &rarr;
              </Link>
              <Link
                href="/docs"
                className="h-8 px-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 flex items-center"
              >
                Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
