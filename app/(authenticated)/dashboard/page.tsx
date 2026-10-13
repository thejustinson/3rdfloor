'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '../actions';
import {
  Building2,
  Coins,
  Layers,
  PieChart,
  Plus,
  Code2,
} from '@/components/docs-icons';

type DashboardStats = {
  totalAssets: number;
  activeOfferings: number;
  capitalRaised: number;
  investors: number;
  registeredInvestorsCount?: number;
  orgWorkspaces?: any[];
  recentAssets?: any[];
  recentOfferings?: any[];
} | null;

export default function GlobalDashboardPage() {
  const { user } = usePrivy();
  const [stats, setStats] = useState<DashboardStats>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getDashboardStats(user.id).then((res) => {
        setStats(res);
        setLoading(false);
      });
    }
  }, [user]);

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
            Platform overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-50 text-balance">
            Portfolio &amp; issuer workspaces
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-pretty">
            Aggregated real-world assets, Token-2022 offerings, and investor
            registries across all your organizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/docs"
            className="h-9 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="size-3.5 text-zinc-400" />
            <span>API documentation</span>
          </Link>
          <Link
            href="/onboarding"
            className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>New organization</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Registered assets</span>
            <Layers className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.totalAssets || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Cataloged across workspaces
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Active offerings</span>
            <Coins className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.activeOfferings || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Open for primary subscriptions
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Settled capital</span>
            <span className="font-mono text-[11px] text-zinc-500">USD</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            $
            {(stats?.capitalRaised || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Confirmed on-chain allocations
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>Investor registry</span>
            <PieChart className="size-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {stats?.investors || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Unique wallets &amp; KYC profiles
          </div>
        </div>
      </div>

      {/* Organization Workspaces Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Organization workspaces
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select an issuer entity to manage its assets, Token-2022
              offerings, investors, and API keys.
            </p>
          </div>
        </div>

        {stats?.orgWorkspaces && stats.orgWorkspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.orgWorkspaces.map((org: any) => (
              <div
                key={org.id}
                className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-zinc-400" />
                      <h3 className="text-base font-semibold text-zinc-100">
                        {org.name}
                      </h3>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-500 mt-1">
                      {org.slug} &bull; {org.role}
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 capitalize">
                    KYB: {org.kybStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/70 text-xs tabular-nums">
                  <div>
                    <div className="text-[11px] text-zinc-500">Assets</div>
                    <div className="text-zinc-200 font-medium mt-0.5">
                      {org.assetsCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Offerings</div>
                    <div className="text-zinc-200 font-medium mt-0.5">
                      {org.offeringsCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Investors</div>
                    <div className="text-zinc-200 font-medium mt-0.5">
                      {org.investorsCount || 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link
                    href={`/org/${org.id}`}
                    className="h-8 px-3.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center"
                  >
                    Open workspace &rarr;
                  </Link>
                  <Link
                    href={`/org/${org.id}/investors`}
                    className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 flex items-center"
                  >
                    Investors
                  </Link>
                  <Link
                    href={`/org/${org.id}/developers`}
                    className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 flex items-center"
                  >
                    API keys
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/15 text-center">
            <p className="text-xs text-zinc-400">
              No organizations found. Click{' '}
              <strong className="text-zinc-200">New organization</strong> above
              to create your first workspace.
            </p>
          </div>
        )}
      </section>

      {/* Recent Offerings & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <h2 className="text-sm font-semibold text-zinc-100">
              Recent offerings
            </h2>
            <Link
              href="/explore"
              className="text-xs text-zinc-400 hover:text-zinc-100"
            >
              Marketplace &rarr;
            </Link>
          </div>

          {stats?.recentOfferings && stats.recentOfferings.length > 0 ? (
            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-900/15 overflow-hidden">
              {stats.recentOfferings.map((off: any) => (
                <Link
                  key={off.id}
                  href={`/org/${off.organizationId}/offerings/${off.id}`}
                  className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-100">
                      {off.name}
                      {off.tokenSymbol && (
                        <span className="ml-2 font-mono text-xs text-zinc-400">
                          ${off.tokenSymbol}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                      Target: ${Number(off.targetRaise || 0).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
                    {off.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/10 text-center text-xs text-zinc-500">
              No offerings configured yet.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <h2 className="text-sm font-semibold text-zinc-100">
              Recent assets
            </h2>
          </div>

          {stats?.recentAssets && stats.recentAssets.length > 0 ? (
            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-900/15 overflow-hidden">
              {stats.recentAssets.map((asset: any) => (
                <Link
                  key={asset.id}
                  href={`/org/${asset.organizationId}/assets/${asset.id}`}
                  className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-100">
                      {asset.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                      {asset.category || 'RWA'} &bull; $
                      {Number(asset.declaredValuation || 0).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[11px] capitalize px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
                    {asset.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/10 text-center text-xs text-zinc-500">
              No assets registered yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
