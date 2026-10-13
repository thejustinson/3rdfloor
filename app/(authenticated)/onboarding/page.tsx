'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createOrganization } from '../actions';
import Link from 'next/link';
import { useOrg } from '../org-context';

export default function NewOrganizationPage() {
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { orgs, setOrgs, setActiveOrg } = useOrg();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const userEmail = user.email?.address || `wallet:${user.wallet?.address}`;
    const name = formData.get('name') as string;

    const res = await createOrganization(formData, user.id, userEmail);

    if (res.success && res.orgId) {
      // Optimistically add to context
      const newOrg = { id: res.orgId, name, slug: '', kybStatus: 'not_started' };
      setOrgs([...orgs, newOrg]);
      setActiveOrg(newOrg);
      router.push(`/org/${res.orgId}`);
    } else {
      setError(res.error || 'Failed to create organization');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-8">
        {orgs.length > 0 && (
          <Link href="/dashboard" className="text-xs font-mono text-zinc-500 hover:text-zinc-300">
            &larr; BACK TO DASHBOARD
          </Link>
        )}
        <h1 className="text-2xl font-medium tracking-tight text-zinc-50 mt-4">Create Organization</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Set up your issuer workspace. This represents the legal entity issuing the tokenized assets.
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
            Organization Name
          </label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            placeholder="e.g. Acme Capital"
            className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="h-10 w-full bg-zinc-50 text-zinc-950 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
}
