'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { CodeBlock } from '@/components/code-block';
import {
  ExternalLink,
  KeyRound,
  Plus,
  Terminal,
  Trash2,
  ShieldAlert,
} from '@/components/docs-icons';
import {
  getOrgApiKeys,
  createOrgApiKey,
  revokeOrgApiKey,
} from '../../../actions';

export default function OrgDevelopersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = parseInt(id, 10);
  const { user } = usePrivy();

  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [framework, setFramework] = useState<'env' | 'curl' | 'typescript'>(
    'env'
  );
  const [maskQuickCopy, setMaskQuickCopy] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [revealedKey, setRevealedKey] = useState<{
    name: string;
    rawKey: string;
  } | null>(null);

  const [confirmRevokeKey, setConfirmRevokeKey] = useState<any | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const loadKeys = () => {
    if (!user?.id) return;
    setLoading(true);
    getOrgApiKeys(orgId, user.id).then((res) => {
      setKeys(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.id) {
      loadKeys();
    }
  }, [user, orgId]);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !keyName.trim()) return;

    setCreating(true);
    setError(null);

    const res = await createOrgApiKey(orgId, user.id, keyName);
    setCreating(false);

    if (res.success && res.rawKey) {
      setRevealedKey({ name: keyName.trim(), rawKey: res.rawKey });
      setKeyName('');
      setShowCreateForm(false);
      loadKeys();
    } else {
      setError(res.error || 'Failed to generate API key.');
    }
  }

  async function handleRevokeConfirmed() {
    if (!user?.id || !confirmRevokeKey) return;

    setRevokingId(confirmRevokeKey.id);
    setError(null);

    const res = await revokeOrgApiKey(confirmRevokeKey.id, orgId, user.id);
    setRevokingId(null);
    setConfirmRevokeKey(null);

    if (res.success) {
      loadKeys();
    } else {
      setError(res.error || 'Failed to revoke API key.');
    }
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeKeyPrefix =
    keys.find((k) => k.status === 'active')?.keyPrefix || '3f_live_9a8b...';
  const rawSecretForSnippet =
    revealedKey?.rawKey ||
    `${activeKeyPrefix.replace('...', '')}your_secret_key_here`;
  const displayedSecret = maskQuickCopy
    ? `${rawSecretForSnippet.slice(0, 12)}••••••••••••••••••••••••`
    : rawSecretForSnippet;

  function buildQuickCopyCode() {
    if (framework === 'env') {
      return `# .env.local\nNEXT_PUBLIC_3RDFLOOR_API_URL="http://localhost:3000/api/v1"\nTHREEFLOOR_SECRET_KEY="${displayedSecret}"`;
    }
    if (framework === 'curl') {
      return `curl -X GET "http://localhost:3000/api/v1/offerings" \\\n  -H "Authorization: Bearer ${displayedSecret}" \\\n  -H "Content-Type: application/json"`;
    }
    return `const response = await fetch("http://localhost:3000/api/v1/offerings", {\n  headers: {\n    "Authorization": "Bearer ${displayedSecret}",\n  },\n});\nconst { data } = await response.json();`;
  }

  if (loading) {
    return (
      <div className="text-sm text-zinc-400 animate-pulse">
        Loading developer credentials&hellip;
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="text-[12px] font-medium text-zinc-400 mb-1">
            Developer credentials
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-50 text-balance">
            API keys &amp; authentication
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed text-pretty">
            Manage workspace-scoped{' '}
            <code className="font-mono text-zinc-200">3f_live_...</code> keys
            for Organization #{orgId}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/api/v1/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <span>openapi.json</span>
            <ExternalLink className="size-3 text-zinc-500" />
          </a>
          <Link
            href="/docs"
            className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="size-3.5" />
            <span>Documentation &amp; sandbox</span>
          </Link>
        </div>
      </div>

      {/* Quick Copy Terminal Snippet */}
      <CodeBlock
        tabs={[
          { id: 'env', label: '.env.local' },
          { id: 'curl', label: 'cURL' },
          { id: 'typescript', label: 'TypeScript' },
        ]}
        activeTab={framework}
        onTabChange={(id) => setFramework(id as any)}
        title={
          framework === 'env'
            ? '.env.local'
            : framework === 'curl'
            ? 'Terminal'
            : 'GET /api/v1/offerings'
        }
        language={framework === 'typescript' ? 'typescript' : 'bash'}
        code={buildQuickCopyCode()}
        canMaskKey
        isMasked={maskQuickCopy}
        onToggleMask={() => setMaskQuickCopy(!maskQuickCopy)}
        surface="dark"
      />

      {/* One-Time Newly Generated Secret Key Banner */}
      {revealedKey && (
        <section className="p-5 rounded-xl border border-zinc-700 bg-zinc-900/60 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Secret key generated — save this key now
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed text-pretty">
                Copy your secret key for{' '}
                <span className="font-medium text-white">
                  {revealedKey.name}
                </span>
                . Because 3rdfloor only stores the SHA-256 hash, the raw secret
                will not be shown again once dismissed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRevealedKey(null)}
              className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <code className="flex-1 px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-100 break-all select-all">
              {revealedKey.rawKey}
            </code>
            <button
              type="button"
              onClick={() => copyText('revealed', revealedKey.rawKey)}
              className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium shrink-0 cursor-pointer"
            >
              {copiedId === 'revealed' ? 'Copied' : 'Copy secret key'}
            </button>
          </div>
        </section>
      )}

      {/* Secret Keys Registry Card */}
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/15 overflow-hidden">
        <div className="p-5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <KeyRound className="size-4 text-zinc-400" />
              <span>Workspace secret keys</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 text-pretty">
              Keys authenticate requests to{' '}
              <code className="font-mono text-zinc-300">/api/v1/*</code> and are
              hashed with SHA-256.
            </p>
          </div>

          {!showCreateForm && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="h-8 px-3.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>New secret key</span>
            </button>
          )}
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateKey}
            className="p-4 border-b border-zinc-800/80 bg-zinc-950 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key label (e.g. Production Backend Server)"
              required
              className="flex-1 h-9 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={creating || !keyName.trim()}
              className="h-9 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Generating...' : 'Generate key'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="h-9 px-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {error && (
          <div className="p-3 border-b border-zinc-800 bg-red-950/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="divide-y divide-zinc-800/70 text-xs">
          {keys.length === 0 ? (
            <div className="p-8 text-zinc-500 text-center">
              No secret keys issued yet.
            </div>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-100">{k.name}</span>
                  <span
                    className={`text-[11px] capitalize px-2.5 py-0.5 rounded-full border ${
                      k.status === 'active'
                        ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {k.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <code className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-zinc-400">
                    {k.keyPrefix}••••••••••••
                  </code>

                  <span className="text-[11px] text-zinc-500 tabular-nums hidden md:inline">
                    {k.lastUsedAt
                      ? `Used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : 'Never used'}
                  </span>

                  {k.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => setConfirmRevokeKey(k)}
                      aria-label={`Revoke API key ${k.name}`}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Revoke key"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center gap-2 text-xs text-zinc-400">
          <ShieldAlert className="size-4 shrink-0 text-zinc-400" />
          <span>
            Never expose <code className="font-mono text-zinc-200">3f_live_...</code>{' '}
            secret keys in client-side code or public repositories.
          </span>
        </div>
      </section>

      {/* Destructive Revoke Confirmation AlertDialog */}
      {confirmRevokeKey && (
        <div
          role="alertdialog"
          aria-labelledby="revoke-key-title"
          aria-describedby="revoke-key-desc"
          className="p-5 rounded-xl border border-red-900/60 bg-red-950/20 space-y-4"
        >
          <div>
            <h3
              id="revoke-key-title"
              className="text-sm font-semibold text-red-400"
            >
              Revoke secret key &ldquo;{confirmRevokeKey.name}&rdquo;?
            </h3>
            <p
              id="revoke-key-desc"
              className="text-xs text-zinc-300 mt-1 leading-relaxed text-pretty"
            >
              Revoking{' '}
              <code className="font-mono">{confirmRevokeKey.keyPrefix}</code> is
              permanent. Any integration using this key will immediately receive{' '}
              <code className="font-mono">401 Unauthorized</code> responses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRevokeConfirmed}
              disabled={revokingId === confirmRevokeKey.id}
              className="h-8 px-4 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-medium cursor-pointer"
            >
              {revokingId === confirmRevokeKey.id
                ? 'Revoking...'
                : 'Confirm revoke'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRevokeKey(null)}
              className="h-8 px-3 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
