'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getAsset } from '../../../../actions';

export default function AssetDetailPage({ params }: { params: Promise<{ id: string, assetId: string }> }) {
  const { id, assetId } = use(params);
  const { user } = usePrivy();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getAsset(parseInt(assetId), parseInt(id)).then(res => {
        setAsset(res);
        setLoading(false);
      });
    }
  }, [user, id, assetId]);

  if (loading) {
    return <div className="text-sm font-mono text-zinc-500 animate-pulse">[FETCHING_ASSET]...</div>;
  }

  if (!asset) {
    return (
      <div className="p-12 border border-zinc-800 border-dashed text-center">
        <h3 className="text-lg font-medium text-zinc-200 mb-1">Asset not found</h3>
        <p className="text-sm text-zinc-500 mb-6">The asset you are looking for does not exist or you don't have access to it.</p>
        <Link href={`/org/${id}/assets`} className="text-xs font-mono text-zinc-400 hover:text-zinc-200">
          &larr; BACK TO ASSETS
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/org/${id}/assets`} className="text-xs font-mono text-zinc-500 hover:text-zinc-300">
            &larr; BACK TO ASSETS
          </Link>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-50 mt-4">{asset.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zinc-400">{asset.category}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 uppercase">
              {asset.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2">Description</h2>
            <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {asset.description || 'No description provided.'}
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <section className="p-5 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs font-mono text-zinc-500 mb-2">DECLARED_VALUATION</div>
            <div className="text-xl font-medium tabular-nums text-zinc-200">
              {asset.declaredValuation ? `$${Number(asset.declaredValuation).toLocaleString()}` : 'N/A'}
            </div>
          </section>
          
          <section className="p-5 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs font-mono text-zinc-500 mb-2">METADATA</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Asset ID</span>
                <span className="text-zinc-300 font-mono">{asset.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-300 font-mono">{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
