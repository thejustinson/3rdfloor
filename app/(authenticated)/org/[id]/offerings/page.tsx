'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { getOrgOfferings } from '../../../actions';

export default function OfferingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = usePrivy();
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getOrgOfferings(parseInt(id)).then(res => {
        setOfferings(res);
        setLoading(false);
      });
    }
  }, [user, id]);

  if (loading) {
    return <div className="text-sm font-mono text-zinc-500 animate-pulse">[FETCHING_OFFERINGS]...</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-50">Offerings</h1>
          <p className="text-sm text-zinc-400 mt-1">Structure and manage investment offerings backed by your registered assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/org/${id}/offerings/new`}
            className="h-9 px-4 bg-zinc-50 text-zinc-950 text-[13px] font-medium transition-transform active:scale-[0.96] hover:bg-zinc-200 flex items-center justify-center"
          >
            Create Draft
          </Link>
        </div>
      </div>

      {offerings.length > 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-400">Offering</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Underlying Asset</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Target Raise</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Standard</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {offerings.map((offering) => (
                <tr key={offering.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-200">{offering.name}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {offering.asset?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    {offering.targetRaise ? `$${Number(offering.targetRaise).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-400">{offering.tokenStandard}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono px-2 py-1 bg-zinc-800 rounded text-zinc-300 uppercase">
                      {offering.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/org/${id}/offerings/${offering.id}`} className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">
                      Manage &rarr;
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-200 mb-1">No offerings prepared</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            Structure your first investment offering. You will need to select an underlying asset that you've previously registered.
          </p>
          <Link 
            href={`/org/${id}/offerings/new`}
            className="h-9 px-4 bg-zinc-800 text-zinc-200 hover:text-zinc-50 hover:bg-zinc-700 text-[13px] font-medium transition-all flex items-center justify-center"
          >
            Create Draft
          </Link>
        </div>
      )}
    </div>
  );
}
