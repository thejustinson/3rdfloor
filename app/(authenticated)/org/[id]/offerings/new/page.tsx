'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { createOffering, getOrgAssets } from '../../../../actions';
import { useOrg } from '../../../../org-context';
import RichTextEditor from './RichTextEditor';

export default function NewOfferingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [fetchingAssets, setFetchingAssets] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    assetId: '',
    targetRaise: '',
    description: '',
    tokenName: '',
    tokenSymbol: '',
    tokenStandard: 'Token-2022',
    tokenSupply: '',
    tokenPrice: ''
  });

  useEffect(() => {
    if (user?.id) {
      getOrgAssets(parseInt(id)).then(res => {
        setAssets(res);
        setFetchingAssets(false);
      });
    }
  }, [user, id]);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.assetId) {
      setError("Please fill in the required fields before continuing.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(1);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('assetId', formData.assetId);
    if (formData.targetRaise) submitData.append('targetRaise', formData.targetRaise);
    submitData.append('description', formData.description);
    if (formData.tokenName) submitData.append('tokenName', formData.tokenName);
    if (formData.tokenSymbol) submitData.append('tokenSymbol', formData.tokenSymbol);
    submitData.append('tokenStandard', formData.tokenStandard);
    if (formData.tokenSupply) submitData.append('tokenSupply', formData.tokenSupply);
    if (formData.tokenPrice) submitData.append('tokenPrice', formData.tokenPrice);

    const orgIdNum = parseInt(id);
    const res = await createOffering(submitData, orgIdNum, user.id);

    if (res.success) {
      router.push(`/org/${id}/offerings`);
    } else {
      setError(res.error || 'Failed to create offering draft');
      setLoading(false);
    }
  }

  if (fetchingAssets) {
    return <div className="text-sm font-mono text-zinc-500 animate-pulse">[LOADING_ASSETS]...</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <Link href={`/org/${id}/offerings`} className="text-xs font-mono text-zinc-500 hover:text-zinc-300">
          &larr; BACK TO OFFERINGS
        </Link>
        <h1 className="text-2xl font-medium tracking-tight text-zinc-50 mt-4">Draft Offering</h1>
        <div className="flex items-center gap-2 mt-4 mb-2">
          <div className={`h-1 flex-1 ${step >= 1 ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
          <div className={`h-1 flex-1 ${step >= 2 ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase">
          Step {step} of 2: {step === 1 ? 'Offering Details' : 'Tokenomics Configuration'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="p-3 border border-red-900/50 bg-red-950/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Offering Name *
              </label>
              <input 
                type="text" 
                id="name" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required 
                placeholder="e.g. Series A Equity Raise"
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="assetId" className="block text-sm font-medium text-zinc-300">
                Underlying Asset *
              </label>
              {assets.length === 0 ? (
                <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400">
                  No assets found. You must <Link href={`/org/${id}/assets/new`} className="text-zinc-200 underline hover:text-zinc-50">register an asset</Link> before creating an offering.
                </div>
              ) : (
                <select 
                  id="assetId" 
                  value={formData.assetId}
                  onChange={e => setFormData({...formData, assetId: e.target.value})}
                  required 
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="">Select an asset...</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="targetRaise" className="block text-sm font-medium text-zinc-300">
                Target Raise (USD)
              </label>
              <input 
                type="number" 
                id="targetRaise" 
                value={formData.targetRaise}
                onChange={e => setFormData({...formData, targetRaise: e.target.value})}
                min="0"
                step="0.01"
                placeholder="e.g. 1000000"
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
                Offering Description & Terms
              </label>
              <RichTextEditor 
                value={formData.description}
                onChange={val => setFormData({...formData, description: val})}
              />
            </div>

            <button 
              type="button"
              onClick={handleNext}
              disabled={assets.length === 0}
              className="h-10 w-full bg-zinc-50 text-zinc-950 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200 disabled:opacity-50"
            >
              Continue to Tokenomics &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tokenName" className="block text-sm font-medium text-zinc-300">
                  Token Name
                </label>
                <input 
                  type="text" 
                  id="tokenName" 
                  value={formData.tokenName}
                  onChange={e => setFormData({...formData, tokenName: e.target.value})}
                  placeholder="e.g. Miami Condo"
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tokenSymbol" className="block text-sm font-medium text-zinc-300">
                  Token Ticker
                </label>
                <input 
                  type="text" 
                  id="tokenSymbol" 
                  value={formData.tokenSymbol}
                  onChange={e => setFormData({...formData, tokenSymbol: e.target.value.toUpperCase()})}
                  placeholder="e.g. MCS"
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenStandard" className="block text-sm font-medium text-zinc-300">
                Token Standard
              </label>
              <select 
                id="tokenStandard" 
                value={formData.tokenStandard}
                onChange={e => setFormData({...formData, tokenStandard: e.target.value})}
                required 
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="Token-2022">Solana Token-2022 (Recommended)</option>
                <option value="SPL-Token">Classic SPL Token</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenSupply" className="block text-sm font-medium text-zinc-300">
                Token Supply
              </label>
              <input 
                type="number" 
                id="tokenSupply" 
                value={formData.tokenSupply}
                onChange={e => setFormData({...formData, tokenSupply: e.target.value})}
                min="1"
                step="1"
                placeholder="e.g. 10000000"
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <p className="text-[10px] text-zinc-500">The total number of tokens that will be minted for this offering.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenPrice" className="block text-sm font-medium text-zinc-300">
                Price Per Token (USD)
              </label>
              <input 
                type="number" 
                id="tokenPrice" 
                value={formData.tokenPrice}
                onChange={e => setFormData({...formData, tokenPrice: e.target.value})}
                min="0"
                step="0.0001"
                placeholder="e.g. 0.10"
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={handleBack}
                className="h-10 px-6 border border-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-900 transition-colors"
              >
                &larr; Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="h-10 flex-1 bg-zinc-50 text-zinc-950 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? 'Creating Draft...' : 'Complete & Save Draft'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
