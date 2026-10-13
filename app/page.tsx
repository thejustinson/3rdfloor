'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { CodeBlock } from '@/components/code-block';

const SHOWCASE_OFFERINGS = [
  {
    index: '01',
    code: 'MFR-2022',
    name: 'Mayfair Commercial Plaza',
    location: 'London, United Kingdom',
    category: 'Commercial Real Estate',
    symbol: '$MFR',
    valuation: '$4,500,000',
    unitPrice: '$100.00',
    targetYield: '7.4% APY',
    allocated: 84.2,
    holders: 42,
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  {
    index: '02',
    code: 'GVA-2022',
    name: 'Geneva Post-War Collection',
    location: 'Geneva, Switzerland',
    category: 'Fine Art Custody SPV',
    symbol: '$GVA',
    valuation: '$2,850,000',
    unitPrice: '$250.00',
    targetYield: 'Appreciation',
    allocated: 62.0,
    holders: 19,
    mint: '9pLmN4vQ2wR8kXzT6yH3jF1cB5nM7qW2eR4tY6uI8oP0',
  },
  {
    index: '03',
    code: 'SSC-2022',
    name: 'Senior Secured Credit III',
    location: 'New York, United States',
    category: 'Private Credit Yield',
    symbol: '$SSC3',
    valuation: '$10,000,000',
    unitPrice: '$1,000.00',
    targetYield: '10.8% APY',
    allocated: 100.0,
    holders: 68,
    mint: '4kRtY8uI2oP6aS9dF3gH5jK7lZ1xC3vB5nM9qW4eR2tY',
  },
  {
    index: '04',
    code: 'NSG-2022',
    name: 'Nordic Solar Grid SPV',
    location: 'Stockholm, Sweden',
    category: 'Renewable Infrastructure',
    symbol: '$NSG',
    valuation: '$6,200,000',
    unitPrice: '$50.00',
    targetYield: '8.2% APY',
    allocated: 45.5,
    holders: 31,
    mint: '2wE4rT6yU8iO0pA3sD5fG7hJ9kL1zX3cV5bN7mQ9wE2r',
  },
];

const SERVICES = [
  {
    num: '01',
    title: 'Multi-tenant organization & KYB',
    summary:
      'Provision isolated SPV workspaces, invite legal and compliance operators, and complete entity KYB verification before public issuance.',
    deliverable: 'Workspace + Operator Roles',
  },
  {
    num: '02',
    title: 'Asset structuring & Token-2022 mints',
    summary:
      'Register real estate, private credit, or fine art custody records and atomically initialize SPL Token-2022 mints with on-chain MetadataPointer extensions.',
    deliverable: 'SPL Token-2022 + Metadata',
  },
  {
    num: '03',
    title: 'Investor KYC registry & ATA settlement',
    summary:
      'Onboard accredited and institutional investors via UI or REST API, verify KYC status, and settle primary subscriptions directly to Solana ATAs.',
    deliverable: 'Whitelisted Registry + ATA',
  },
  {
    num: '04',
    title: 'Reconciled cap table & distributions',
    summary:
      'Audit real-time holder balances reconciled against platform subscriptions and execute pro-rata dividend distributions.',
    deliverable: 'On-Chain Cap Table + Yield',
  },
];

const API_EXAMPLES = [
  {
    id: 'investors',
    label: 'Onboard investor',
    title: 'POST /api/v1/investors',
    language: 'typescript' as const,
    code: `const res = await fetch("https://3rdfloor.io/api/v1/investors", {
  method: "POST",
  headers: {
    "Authorization": "Bearer 3f_live_9a8b7c6d5e4f3a2b",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Apex Institutional Partners LP",
    email: "treasury@apex-lp.io",
    walletAddress: "GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX",
    investorType: "institutional",
    jurisdiction: "US",
    kycStatus: "approved"
  }),
});`,
  },
  {
    id: 'mint',
    label: 'Deploy Token-2022',
    title: 'POST /api/v1/offerings/1/status',
    language: 'typescript' as const,
    code: `const res = await fetch("https://3rdfloor.io/api/v1/offerings/1/status", {
  method: "POST",
  headers: {
    "Authorization": "Bearer 3f_live_9a8b7c6d5e4f3a2b",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    status: "open",
    deployToken: true // Initializes SPL Token-2022 + MetadataPointer
  }),
});`,
  },
  {
    id: 'settle',
    label: 'Settle ATA',
    title: 'POST /api/v1/subscriptions/12/settle',
    language: 'typescript' as const,
    code: `// Provisions investor ATA & transfers Token-2022 units on Solana
const settleRes = await fetch("https://3rdfloor.io/api/v1/subscriptions/12/settle", {
  method: "POST",
  headers: { "Authorization": "Bearer 3f_live_9a8b7c6d5e4f3a2b" },
});

const { data } = await settleRes.json();
console.log("Solana Explorer:", data.solanaExplorerUrl);`,
  },
  {
    id: 'cli',
    label: 'cURL',
    title: 'Terminal',
    language: 'bash' as const,
    code: `curl -X POST "https://3rdfloor.io/api/v1/investors" \\
  -H "Authorization: Bearer 3f_live_9a8b7c6d5e4f3a2b" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Apex Partners LP","email":"ops@apex.io","kycStatus":"approved"}'`,
  },
];

function SixSpokeAsterisk({ className = 'size-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="22"
        y1="3"
        x2="22"
        y2="41"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
      <line
        x1="3"
        y1="22"
        x2="41"
        y2="22"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
      <line
        x1="10"
        y1="34"
        x2="34"
        y2="10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.25 8H12.75M12.75 8L8.75 4M12.75 8L8.75 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockOutlineIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 4.75V8L10.25 9.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedExampleId, setSelectedExampleId] = useState(API_EXAMPLES[0].id);
  const [utcTime, setUtcTime] = useState('13:49');
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SHOWCASE_OFFERINGS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentOffering = SHOWCASE_OFFERINGS[activeSlide];
  const selectedExample =
    API_EXAMPLES.find((e) => e.id === selectedExampleId) || API_EXAMPLES[0];

  function handlePrimaryAction() {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  }

  return (
    <div className="min-h-dvh bg-white text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* =====================================================================
            TOP NAVIGATION BAR
            ===================================================================== */}
        <header className="pt-8 pb-6 grid grid-cols-2 lg:grid-cols-12 items-center gap-y-4">
          {/* Col 1-2: Brand Wordmark */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="text-[19px] font-medium tracking-[-0.025em] text-[#0A0A0A] inline-block"
            >
              3rdfloor
            </Link>
          </div>

          {/* Col 3-7: Main Navigation (Aligned with Hero Headline & Blurb) */}
          <nav className="hidden lg:flex lg:col-start-3 lg:col-span-5 items-center gap-9 text-[14px] font-normal text-[#0A0A0A]">
            <a href="#services" className="hover:opacity-60 transition-opacity">
              Services
            </a>
            <Link
              href="/explore"
              className="hover:opacity-60 transition-opacity"
            >
              Offerings
            </Link>
            <Link href="/docs" className="hover:opacity-60 transition-opacity">
              Documentation
            </Link>
            <Link
              href="/test-sdk"
              className="hover:opacity-60 transition-opacity flex items-center gap-1.5"
            >
              <span>Test Lab</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0A0A0A] text-white">
                SDK
              </span>
            </Link>
            <a href="#api" className="hover:opacity-60 transition-opacity">
              REST API
            </a>
          </nav>

          {/* Col 8-10: Location / Network Time Indicator */}
          <div className="hidden lg:flex lg:col-start-8 lg:col-span-3 items-center justify-end pr-6 text-[13.5px] text-[#0A0A0A] tabular-nums gap-2">
            <ClockOutlineIcon className="size-3.5 text-[#737373]" />
            <span>Solana Mainnet, {utcTime}</span>
          </div>

          {/* Col 11-12: Underlined Primary CTA Link */}
          <div className="lg:col-start-11 lg:col-span-2 flex items-center justify-end gap-5">
            <Link
              href="/docs"
              className="lg:hidden text-[13.5px] text-[#0A0A0A] hover:opacity-60"
            >
              Docs
            </Link>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={!ready}
              className="text-[14px] font-normal text-[#0A0A0A] border-b border-[#0A0A0A] pb-0.5 hover:opacity-60 transition-opacity cursor-pointer disabled:opacity-40"
            >
              {authenticated ? 'Open workspace' : 'Start a project'}
            </button>
          </div>
        </header>

        {/* =====================================================================
            HERO CENTERPIECE
            ===================================================================== */}
        <section className="pt-16 sm:pt-24 lg:pt-28 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 items-start gap-y-8">
          {/* Col 1-2: Signature 6-Spoke Asterisk */}
          <div className="lg:col-span-2 pt-2 sm:pt-4">
            <SixSpokeAsterisk className="size-9 sm:size-11 text-[#0A0A0A]" />
          </div>

          {/* Col 3-11: Display Headline + Paired Pill & Circle CTA */}
          <div className="lg:col-start-3 lg:col-span-9">
            <h1 className="text-[clamp(2.65rem,5.4vw,5.15rem)] font-normal tracking-[-0.028em] leading-[1.1] text-[#0A0A0A] max-w-[14.5ch] text-balance">
              Bringing ground shifting assets on-chain.
            </h1>

            {/* Paired Pill + Circle Arrow Button */}
            <div className="mt-10 sm:mt-12 flex flex-wrap items-center gap-7">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!ready}
                className="group inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="h-[52px] px-8 rounded-full bg-[#0A0A0A] text-white text-[14px] font-normal flex items-center justify-center group-hover:bg-[#262626] transition-colors">
                  {authenticated ? 'Enter your workspace' : 'How we can help you'}
                </span>
                <span className="size-[52px] rounded-full bg-[#0A0A0A] text-white flex items-center justify-center group-hover:bg-[#262626] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon className="size-4" />
                </span>
              </button>

              <Link
                href="/docs"
                className="text-[14px] text-[#525252] hover:text-[#0A0A0A] underline underline-offset-4 transition-colors"
              >
                Explore API &amp; documentation
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            LOWER FOLD EDITORIAL METADATA ROW
            ===================================================================== */}
        <div className="pb-8 grid grid-cols-1 lg:grid-cols-12 items-end gap-y-6">
          {/* Col 1-2: Index Marker ● 3F/00 */}
          <div className="lg:col-span-2 flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-[#0A0A0A] inline-block" />
            <span className="text-[13.5px] font-medium tracking-[-0.01em] text-[#0A0A0A] tabular-nums">
              3F/00
            </span>
          </div>

          {/* Col 3-7: 3-Line Editorial Description (Aligned with Headline & Nav) */}
          <div className="lg:col-start-3 lg:col-span-5">
            <p className="text-[14.5px] leading-[1.6] text-[#171717] max-w-[40ch] font-normal text-pretty">
              3rdfloor is a tokenization infrastructure studio that creates
              compliant offerings, investor registries, and programmable
              ownership aimed at making institutional capital markets more open.
            </p>
          </div>

          {/* Col 10-12: Live Offerings Counter */}
          <div className="lg:col-start-10 lg:col-span-3 flex lg:justify-end items-baseline gap-2 text-[13.5px] tabular-nums">
            <span className="font-medium text-[#0A0A0A]">Live Registry</span>
            <span className="text-[#8E8E93]">0{activeSlide + 1}:04</span>
          </div>
        </div>

        {/* =====================================================================
            WIDE ROUNDED VISUAL SHOWCASE FRAME
            ===================================================================== */}
        <section className="pb-24">
          <div className="relative rounded-[20px] overflow-hidden bg-[#0A0A0A] text-white border border-[#1F1F1F]">
            <div className="p-8 sm:p-12 lg:p-16 min-h-[430px] sm:min-h-[480px] flex flex-col justify-between gap-10">
              {/* Top Showcase Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 pb-6">
                <div className="flex items-center gap-3.5">
                  <span className="px-3.5 py-1 rounded-full bg-white/10 text-[12.5px] font-normal text-white">
                    {currentOffering.category}
                  </span>
                  <span className="text-[13.5px] text-white/60">
                    {currentOffering.location}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {SHOWCASE_OFFERINGS.map((item, idx) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`h-8 px-3.5 rounded-full text-[12.5px] tabular-nums transition-colors cursor-pointer ${
                        idx === activeSlide
                          ? 'bg-white text-[#0A0A0A] font-medium'
                          : 'bg-white/8 text-white/65 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {item.index}
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Showcase Specimen */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentOffering.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end my-auto py-4"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-[12px] font-mono uppercase tracking-[0.06em] text-white/55">
                      SPL TOKEN-2022 OFFERING &bull; {currentOffering.symbol}
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-[-0.025em] leading-[1.14] text-white text-balance">
                      {currentOffering.name}
                    </h2>
                    <div className="pt-2 flex flex-wrap items-center gap-5 text-[13.5px] text-white/70 font-mono">
                      <span>
                        Mint: {currentOffering.mint.slice(0, 10)}...
                        {currentOffering.mint.slice(-6)}
                      </span>
                      <span>&bull;</span>
                      <span>{currentOffering.holders} verified holders</span>
                    </div>
                  </div>

                  {/* Right Financial Specimen Card */}
                  <div className="lg:col-span-5 bg-[#121212] border border-white/12 rounded-2xl p-6 sm:p-7 space-y-6">
                    <div className="grid grid-cols-3 gap-4 tabular-nums">
                      <div>
                        <div className="text-[12px] text-white/55">
                          Declared NAV
                        </div>
                        <div className="text-[16px] font-medium text-white mt-1.5">
                          {currentOffering.valuation}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-white/55">
                          Unit Price
                        </div>
                        <div className="text-[16px] font-medium text-white mt-1.5">
                          {currentOffering.unitPrice}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-white/55">
                          Target Yield
                        </div>
                        <div className="text-[16px] font-medium text-white mt-1.5">
                          {currentOffering.targetYield}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-[12.5px] tabular-nums">
                        <span className="text-white/65">
                          Primary allocation settled
                        </span>
                        <span className="text-white font-medium">
                          {currentOffering.allocated.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-white"
                          initial={{ width: 0 }}
                          animate={{ width: `${currentOffering.allocated}%` }}
                          transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Showcase Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-6 text-[13.5px] text-white/75">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-white" />
                  <span>Atomic Associated Token Account (ATA) settlement</span>
                </div>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 text-white hover:opacity-75 transition-opacity"
                >
                  <span>Browse all offerings in marketplace</span>
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 3F/01 — CAPABILITIES & LIFECYCLE
            ===================================================================== */}
        <section
          id="services"
          className="py-24 border-t border-[#E5E5E5] grid grid-cols-1 lg:grid-cols-12 gap-y-10 scroll-mt-16"
        >
          {/* Left Rail Index */}
          <div className="lg:col-span-2 flex items-start gap-2.5 pt-1.5">
            <span className="size-2.5 rounded-full bg-[#0A0A0A] inline-block mt-1" />
            <span className="text-[13.5px] font-medium tracking-[-0.01em] text-[#0A0A0A] tabular-nums">
              3F/01
            </span>
          </div>

          {/* Main Editorial Column */}
          <div className="lg:col-start-3 lg:col-span-10 space-y-16">
            <div className="max-w-2xl space-y-5">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-[-0.025em] leading-[1.15] text-[#0A0A0A] text-balance">
                A complete lifecycle for tokenized private markets.
              </h2>
              <p className="text-[15.5px] leading-[1.7] text-[#525252] max-w-[54ch] text-pretty">
                Every module is designed around legal SPV isolation, investor
                KYC compliance, and deterministic SPL Token-2022 execution.
              </p>
            </div>

            <div className="divide-y divide-[#E5E5E5] border-t border-b border-[#E5E5E5]">
              {SERVICES.map((service) => (
                <div
                  key={service.num}
                  className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline"
                >
                  <div className="md:col-span-1 text-[13.5px] font-mono text-[#737373] tabular-nums">
                    {service.num}
                  </div>
                  <div className="md:col-span-4">
                    <h3 className="text-[18px] font-medium tracking-[-0.015em] leading-[1.35] text-[#0A0A0A]">
                      {service.title}
                    </h3>
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-[14.5px] leading-[1.68] text-[#525252] text-pretty">
                      {service.summary}
                    </p>
                  </div>
                  <div className="md:col-span-2 md:text-right">
                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#F5F5F5] text-[12px] font-medium text-[#0A0A0A]">
                      {service.deliverable}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 3F/02 — HEADLESS REST API V1 & INVESTOR ENGINE
            ===================================================================== */}
        <section
          id="api"
          className="py-24 border-t border-[#E5E5E5] grid grid-cols-1 lg:grid-cols-12 gap-y-10 scroll-mt-16"
        >
          {/* Left Rail Index */}
          <div className="lg:col-span-2 flex items-start gap-2.5 pt-1.5">
            <span className="size-2.5 rounded-full bg-[#0A0A0A] inline-block mt-1" />
            <span className="text-[13.5px] font-medium tracking-[-0.01em] text-[#0A0A0A] tabular-nums">
              3F/02
            </span>
          </div>

          {/* Main Content */}
          <div className="lg:col-start-3 lg:col-span-10 grid grid-cols-1 lg:grid-cols-10 gap-12 items-start">
            <div className="lg:col-span-4 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.025em] leading-[1.15] text-[#0A0A0A] text-balance">
                Headless REST API for automated issuance.
              </h2>
              <p className="text-[15px] leading-[1.7] text-[#525252] text-pretty">
                Every workflow in the dashboard is exposed through our
                organization-scoped v1 REST API. Generate a{' '}
                <code className="font-mono text-[12.5px] px-1.5 py-0.5 rounded bg-[#F5F5F5] border border-[#E5E5E5] text-[#0A0A0A]">
                  3f_live_...
                </code>{' '}
                key to onboard investors, verify KYC, deploy Token-2022 mints,
                and settle subscriptions from your own backend.
              </p>

              {/* Paired Pill + Circle CTA to Documentation */}
              <div className="pt-3">
                <Link
                  href="/docs"
                  className="group inline-flex items-center gap-1.5"
                >
                  <span className="h-[48px] px-7 rounded-full bg-[#0A0A0A] text-white text-[13.5px] font-normal flex items-center justify-center group-hover:bg-[#262626] transition-colors">
                    Open API Reference &amp; Sandbox
                  </span>
                  <span className="size-[48px] rounded-full bg-[#0A0A0A] text-white flex items-center justify-center group-hover:bg-[#262626] transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRightIcon className="size-4" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Code Specimen Frame (Using the new Terminal CodeBlock) */}
            <div className="lg:col-span-6">
              <CodeBlock
                tabs={API_EXAMPLES.map((ex) => ({
                  id: ex.id,
                  label: ex.label,
                }))}
                activeTab={selectedExample.id}
                onTabChange={setSelectedExampleId}
                title={selectedExample.title}
                language={selectedExample.language}
                code={selectedExample.code}
                surface="light"
              />
            </div>
          </div>
        </section>

        {/* =====================================================================
            FOOTER
            ===================================================================== */}
        <footer className="py-12 border-t border-[#E5E5E5] grid grid-cols-1 lg:grid-cols-12 items-center gap-y-6 text-[13.5px] text-[#525252]">
          <div className="lg:col-span-2 font-medium text-[#0A0A0A]">
            3rdfloor
          </div>
          <div className="lg:col-start-3 lg:col-span-6 flex flex-wrap items-center gap-8 text-[#0A0A0A]">
            <Link href="/docs" className="hover:opacity-60 transition-opacity">
              Documentation
            </Link>
            <Link
              href="/explore"
              className="hover:opacity-60 transition-opacity"
            >
              Marketplace
            </Link>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-60 transition-opacity"
            >
              OpenAPI 3.1
            </a>
          </div>
          <div className="lg:col-start-9 lg:col-span-4 lg:text-right text-[#737373]">
            Programmable ownership on Solana.
          </div>
        </footer>
      </div>
    </div>
  );
}
