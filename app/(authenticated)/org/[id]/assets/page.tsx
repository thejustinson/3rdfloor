'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { getOrgAssets } from '../../../actions';
import { useOrg } from '../../../org-context';

export default function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = usePrivy();
  const { activeOrg } = useOrg();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getOrgAssets(parseInt(id)).then(res => {
        setAssets(res);
        setLoading(false);
      });
    }
  }, [user, id]);

  if (loading) {
    return <div className="text-sm font-mono text-zinc-500 animate-pulse">[FETCHING_ASSETS]...</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-50">Assets</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage the real-world assets registered to this organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/org/${id}/assets/new`}
            className="h-9 px-4 bg-zinc-50 text-zinc-950 text-[13px] font-medium transition-transform active:scale-[0.96] hover:bg-zinc-200 flex items-center justify-center"
          >
            Register Asset
          </Link>
        </div>
      </div>

      {assets.length > 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-400">Name</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Category</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Valuation</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-200">{asset.name}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-xs">{asset.description}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {asset.category}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    {asset.declaredValuation ? `$${Number(asset.declaredValuation).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono px-2 py-1 bg-zinc-800 rounded text-zinc-300 uppercase">
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/org/${id}/assets/${asset.id}`} className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center">
          <div className="size-12 rounded bg-zinc-900 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-1">No assets found</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            Get started by registering a real-world asset. Assets must be created before you can structure investment offerings.
          </p>
          <Link 
            href={`/org/${id}/assets/new`}
            className="h-9 px-4 bg-zinc-800 text-zinc-200 hover:text-zinc-50 hover:bg-zinc-700 text-[13px] font-medium transition-all flex items-center justify-center"
          >
            Register Asset
          </Link>
        </div>
      )}
    </div>
  );
}
