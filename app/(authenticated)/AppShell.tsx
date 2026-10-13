'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { checkHasOrganization, getUserOrganizations } from './actions';
import { useOrg } from './org-context';
import {
  BookOpen,
  Building2,
  ChevronDown,
  Code2,
  Coins,
  Layers,
  PieChart,
  Plus,
  Search,
} from '@/components/docs-icons';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingOrg, setCheckingOrg] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const { orgs, setOrgs, activeOrg, setActiveOrg } = useOrg();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (ready && authenticated && user) {
      Promise.all([
        checkHasOrganization(user.id),
        getUserOrganizations(user.id),
      ]).then(([hasOrgResult, orgsResult]) => {
        setHasOrg(hasOrgResult);
        setOrgs(orgsResult as any);
        if (!activeOrg && orgsResult && orgsResult.length > 0) {
          setActiveOrg(orgsResult[0] as any);
        }
        setCheckingOrg(false);
        if (!hasOrgResult && pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      });
    }
  }, [ready, authenticated, user, pathname, router, setOrgs]);

  const isOrgDashboard = pathname?.startsWith('/org/');

  useEffect(() => {
    if (isOrgDashboard && orgs.length > 0) {
      const match = pathname.match(/^\/org\/(\d+)/);
      if (match) {
        const urlOrgId = parseInt(match[1], 10);
        if (activeOrg?.id !== urlOrgId) {
          const matchedOrg = orgs.find((o) => o.id === urlOrgId);
          if (matchedOrg) {
            setActiveOrg(matchedOrg);
          }
        }
      }
    }
  }, [pathname, isOrgDashboard, orgs, activeOrg, setActiveOrg]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!ready || !authenticated || checkingOrg) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-300 text-xs">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
          <span className="size-1.5 rounded-full bg-zinc-300 animate-pulse" />
          <span>Loading workspace&hellip;</span>
        </div>
      </div>
    );
  }

  if (pathname === '/onboarding') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
        {children}
      </div>
    );
  }

  const orgPrefix = activeOrg ? `/org/${activeOrg.id}` : '/dashboard';

  const platformNav = [
    {
      label: 'Overview',
      href: '/dashboard',
      active: pathname === '/dashboard',
      icon: Layers,
    },
    {
      label: 'Marketplace',
      href: '/explore',
      active: pathname?.startsWith('/explore'),
      icon: Search,
    },
    {
      label: 'Portfolio',
      href: '/portfolio',
      active: pathname?.startsWith('/portfolio'),
      icon: PieChart,
    },
    {
      label: 'Documentation',
      href: '/docs',
      active: pathname?.startsWith('/docs'),
      icon: BookOpen,
    },
  ];

  const workspaceNav = activeOrg
    ? [
        {
          label: 'Workspace home',
          href: `/org/${activeOrg.id}`,
          active: pathname === `/org/${activeOrg.id}`,
          icon: Building2,
        },
        {
          label: 'Assets',
          href: `${orgPrefix}/assets`,
          active: pathname?.includes('/assets'),
          icon: Layers,
        },
        {
          label: 'Offerings & tokens',
          href: `${orgPrefix}/offerings`,
          active: pathname?.includes('/offerings'),
          icon: Coins,
        },
        {
          label: 'Investors & cap table',
          href: `${orgPrefix}/investors`,
          active: pathname?.includes('/investors'),
          icon: PieChart,
        },
        {
          label: 'API keys',
          href: `${orgPrefix}/developers`,
          active: pathname?.includes('/developers'),
          icon: Code2,
        },
      ]
    : [];

  return (
    <div className="min-h-dvh flex bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Left Sidebar (240px per 71UI specification) */}
      <aside className="w-60 shrink-0 border-r border-zinc-800/80 flex flex-col justify-between bg-zinc-950">
        <div>
          {/* Brand Header */}
          <div className="h-14 px-5 border-b border-zinc-800/80 flex items-center justify-between">
            <Link
              href="/"
              className="text-[16px] font-medium tracking-[-0.03em] text-zinc-100"
            >
              3rdfloor
            </Link>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              v1
            </span>
          </div>

          {/* Organization Switcher */}
          <div className="p-3.5 border-b border-zinc-800/80" ref={dropdownRef}>
            <div className="text-[11px] font-medium text-zinc-500 mb-1.5 px-1">
              Organization
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full h-9 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left cursor-pointer"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="size-1.5 rounded-full shrink-0 bg-zinc-300" />
                  <span className="text-[13px] font-medium text-zinc-100 truncate">
                    {activeOrg ? activeOrg.name : 'Select workspace'}
                  </span>
                </div>
                <ChevronDown
                  className={`size-3.5 text-zinc-400 shrink-0 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-10 left-0 right-0 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl z-30 overflow-hidden">
                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-900">
                    {orgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setActiveOrg(org);
                          setIsDropdownOpen(false);
                          router.push(`/org/${org.id}`);
                        }}
                        className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer ${
                          activeOrg?.id === org.id
                            ? 'text-zinc-50 bg-zinc-900/70 font-medium'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span className="truncate">{org.name}</span>
                        <span className="font-mono text-[10px] text-zinc-500 ml-2 capitalize">
                          {org.kybStatus === 'approved' ? 'Verified' : org.kybStatus}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-zinc-800 p-1.5 bg-zinc-900/30">
                    <Link
                      href="/onboarding"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[12px] text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900 transition-colors"
                    >
                      <Plus className="size-3.5 text-zinc-400" />
                      <span>New organization</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3.5 space-y-6">
            <div>
              <div className="text-[11px] font-medium text-zinc-500 mb-1.5 px-2.5">
                Platform
              </div>
              <div className="space-y-0.5">
                {platformNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] transition-colors ${
                        item.active
                          ? 'bg-zinc-900 text-zinc-50 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                      }`}
                    >
                      <Icon
                        className={`size-3.5 shrink-0 ${
                          item.active ? 'text-zinc-100' : 'text-zinc-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {activeOrg && (
              <div>
                <div className="text-[11px] font-medium text-zinc-500 mb-1.5 px-2.5 truncate">
                  {activeOrg.name}
                </div>
                <div className="space-y-0.5">
                  {workspaceNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] transition-colors ${
                          item.active
                            ? 'bg-zinc-900 text-zinc-50 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                        }`}
                      >
                        <Icon
                          className={`size-3.5 shrink-0 ${
                            item.active ? 'text-zinc-100' : 'text-zinc-500'
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-950 space-y-2">
          <div className="px-2.5 py-2 rounded-lg border border-zinc-900 bg-zinc-900/30">
            <div className="text-[11px] text-zinc-500">Signed in as</div>
            <div className="text-[12px] text-zinc-300 truncate mt-0.5">
              {user?.email?.address || user?.wallet?.address || 'Operator'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-between w-full h-8 px-2.5 rounded-md text-[12px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <span>Sign out</span>
            <span>&rarr;</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-h-dvh overflow-y-auto">
        <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 md:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[13px] font-medium text-zinc-200 truncate">
              {activeOrg ? activeOrg.name : 'Workspace'}
            </span>
            {activeOrg && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 capitalize">
                KYB: {activeOrg.kybStatus.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-[11px] text-zinc-400">
              <span className="size-1.5 rounded-full bg-zinc-300" />
              <span>Solana Devnet</span>
            </div>

            {activeOrg && (
              <>
                <Link
                  href={`/org/${activeOrg.id}/assets/new`}
                  className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-[12px] text-zinc-200 transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>New asset</span>
                </Link>
                <Link
                  href={`/org/${activeOrg.id}/offerings/new`}
                  className="hidden md:flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-[12px] font-medium transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>New offering</span>
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
