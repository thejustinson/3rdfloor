'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPendingApprovals, approveOrg, approveAsset, approveOffering } from './actions';

export default function AdminDashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [data, setData] = useState<{ orgs: any[], assets: any[], offerings: any[] }>({ orgs: [], assets: [], offerings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const loadData = () => {
    setLoading(true);
    getPendingApprovals().then(res => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (ready && authenticated) {
      loadData();
    }
  }, [ready, authenticated]);

  const handleApproveOrg = async (id: number) => {
    await approveOrg(id);
    loadData();
  };

  const handleApproveAsset = async (id: number) => {
    await approveAsset(id);
    loadData();
  };

  const handleApproveOffering = async (id: number) => {
    await approveOffering(id);
    loadData();
  };

  if (!ready || !authenticated || loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-50 font-mono text-sm">[SYS_LOADING_ADMIN]...</div>;
  }

  // NOTE: In a real app, we would verify `user` has an ADMIN role globally before showing this page.

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 font-sans p-8 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-red-500">System Admin Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Review and approve KYB, Assets, and Offerings.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-mono text-zinc-500 hover:text-zinc-300">
            &larr; EXIT ADMIN
          </Link>
        </div>

        {/* Organizations Pending KYB */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Pending KYB Verifications</h2>
          {data.orgs.length === 0 ? (
            <div className="p-6 border border-zinc-800 border-dashed text-zinc-500 text-sm">No organizations pending KYB.</div>
          ) : (
            <div className="space-y-3">
              {data.orgs.map(org => (
                <div key={org.id} className="p-4 border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{org.name}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">ID: {org.id} | Slug: {org.slug}</div>
                  </div>
                  <button 
                    onClick={() => handleApproveOrg(org.id)}
                    className="h-8 px-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 text-xs font-medium rounded transition-colors"
                  >
                    Approve KYB
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assets Pending Review */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Assets Awaiting Review</h2>
          {data.assets.length === 0 ? (
            <div className="p-6 border border-zinc-800 border-dashed text-zinc-500 text-sm">No assets pending review.</div>
          ) : (
            <div className="space-y-3">
              {data.assets.map(asset => (
                <div key={asset.id} className="p-4 border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{asset.name}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">Org: {asset.organization?.name} | Val: ${Number(asset.declaredValuation).toLocaleString()} | Status: {asset.status}</div>
                  </div>
                  <button 
                    onClick={() => handleApproveAsset(asset.id)}
                    className="h-8 px-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 text-xs font-medium rounded transition-colors"
                  >
                    Approve Asset
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Offerings Pending Review */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Offerings Awaiting Review</h2>
          {data.offerings.length === 0 ? (
            <div className="p-6 border border-zinc-800 border-dashed text-zinc-500 text-sm">No offerings pending review.</div>
          ) : (
            <div className="space-y-3">
              {data.offerings.map(offering => (
                <div key={offering.id} className="p-4 border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{offering.name}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">Org: {offering.organization?.name} | Asset: {offering.asset?.name} | Status: {offering.status}</div>
                  </div>
                  <button 
                    onClick={() => handleApproveOffering(offering.id)}
                    className="h-8 px-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 text-xs font-medium rounded transition-colors"
                  >
                    Approve Offering
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
