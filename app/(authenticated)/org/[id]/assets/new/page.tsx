'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import Link from 'next/link';
import { createAsset } from '../../../../actions';

export default function NewAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const orgIdNum = parseInt(id);

    const res = await createAsset(formData, orgIdNum, user.id);

    if (res.success) {
      router.push(`/org/${id}`); // We can later redirect to the asset's specific page /org/[id]/assets/[assetId]
    } else {
      setError(res.error || 'Failed to register asset');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <Link href={`/org/${id}`} className="text-xs font-mono text-zinc-500 hover:text-zinc-300">
          &larr; BACK TO OVERVIEW
        </Link>
        <h1 className="text-2xl font-medium tracking-tight text-zinc-50 mt-4">Register Asset</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Create a private record for this asset. It will remain in draft status and will not be publicly visible until your organization passes verification and the asset is approved.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="p-3 border border-red-900/50 bg-red-950/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
            Asset Name
          </label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            placeholder="e.g. 123 Main St Commercial Property"
            className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-zinc-300">
            Category
          </label>
          <select 
            id="category" 
            name="category" 
            required 
            className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="">Select a category...</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Private Equity">Private Equity</option>
            <option value="Art & Collectibles">Art & Collectibles</option>
            <option value="Debt Instrument">Debt Instrument</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="declaredValuation" className="block text-sm font-medium text-zinc-300">
            Declared Valuation (USD)
          </label>
          <input 
            type="number" 
            id="declaredValuation" 
            name="declaredValuation" 
            min="0"
            step="0.01"
            placeholder="e.g. 5000000"
            className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <p className="text-xs text-zinc-500">Subject to third-party appraisal and verification during the review process.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
            Description
          </label>
          <textarea 
            id="description" 
            name="description" 
            rows={4}
            placeholder="Brief overview of the asset and its investment thesis..."
            className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="h-10 w-full bg-zinc-50 text-zinc-950 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? 'Saving Draft...' : 'Save Asset Draft'}
        </button>
      </form>
    </div>
  );
}
