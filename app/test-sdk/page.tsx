'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CodeBlock } from '@/components/code-block';
import {
  Check,
  ChevronRight,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
} from '@/components/docs-icons';
import {
  executeSdkStep,
  type StepId,
  type StepExecutionResult,
} from './actions';

type StepDefinition = {
  id: StepId;
  stepNumber: string;
  name: string;
  shortDesc: string;
  objective: string;
  underTheHood: string[];
  invariants: string[];
  sdkSnippet: (inputs: Record<string, any>, state: Record<string, any>) => string;
  defaultInputs: Record<string, any>;
};

const STEPS: StepDefinition[] = [
  {
    id: 'step-auth',
    stepNumber: '01',
    name: 'Client Authentication & Security Guard',
    shortDesc: 'Verify secret key injection and invalid-key rejection',
    objective:
      'You are testing client initialization and authentication guardrails using new ThirdFloor({ apiKey }). This ensures that the SDK properly injects the RFC 6750 Bearer header, sets a 30s timeout guard, and immediately rejects empty or missing keys with a typed ThirdFloorError.',
    underTheHood: [
      'The SDK checks that apiKey starts with a valid non-empty string; throws ThirdFloorError(MISSING_API_KEY) if empty.',
      'Configures internal HttpClient with Authorization: Bearer 3f_live_... and custom User-Agent headers.',
      'Pings the workspace to verify cryptographic SHA-256 key matching in Postgres.',
    ],
    invariants: [
      'Client constructor rejects empty/whitespace apiKey (MISSING_API_KEY)',
      'Authorization: Bearer header format verified',
      'Zero-plaintext SHA-256 server validation pipeline',
    ],
    defaultInputs: {},
    sdkSnippet: (_, __) =>
      `import { ThirdFloor, ThirdFloorError } from '@3rdfloor/sdk';

// 1. Initialize typed SDK client with workspace secret key
const rwa = new ThirdFloor({
  apiKey: process.env.THREEFLOOR_SECRET_KEY!, // '3f_live_...'
  baseUrl: 'http://localhost:3000/api/v1',
});

// 2. Client is ready and authenticated for all resource operations!`,
  },
  {
    id: 'step-asset',
    stepNumber: '02',
    name: 'Real-World Asset (RWA) Collateral Registration',
    shortDesc: 'Catalog the physical/financial asset and record its NAV',
    objective:
      'You are testing rwa.assets.create() to catalog underlying physical or financial collateral (e.g. Commercial Real Estate held in a Delaware Series LLC SPV) and establish its baseline Net Asset Value (NAV). In 3rdfloor, Assets are separated from Offerings (1:N model) so one property can back multiple sequential funding tranches.',
    underTheHood: [
      'SDK sends POST /api/v1/assets with name, category, and declaredValuation.',
      'Postgres inserts the row with arbitrary-precision numeric valuation (preventing float rounding errors).',
      'The asset is initialized in "draft" status and linked to your organizationId.',
    ],
    invariants: [
      'Valuation stored as exact numeric decimal (no IEEE 754 floating drift)',
      'Asset strictly isolated to the authenticated organization workspace',
      'Initial asset status set to draft',
    ],
    defaultInputs: {
      assetName: 'Mayfair Commercial Plaza',
      assetCategory: 'Real Estate',
      declaredValuation: 4500000,
    },
    sdkSnippet: (inputs, _) =>
      `// Register the underlying physical/financial collateral
const asset = await rwa.assets.create({
  name: "${inputs.assetName || 'Mayfair Commercial Plaza'}",
  category: "${inputs.assetCategory || 'Real Estate'}",
  declaredValuation: ${inputs.declaredValuation || 4500000},
  currency: "USD",
  description: "Class-A commercial property in London held in a Delaware Series LLC SPV.",
});

console.log("Created Asset ID:", asset.id);`,
  },
  {
    id: 'step-offering',
    stepNumber: '03',
    name: 'Investment Offering & Tokenomics Structuring',
    shortDesc: 'Define capital raise targets and SPL Token-2022 economics',
    objective:
      'You are testing rwa.offerings.create() to structure an investment tranche against the registered asset. You are defining the target capital raise ($4,500,000), ticker symbol (MFR), total token supply (450,000), and unit price ($10.00). This enforces the mathematical invariant: Target Raise = Token Supply * Token Price.',
    underTheHood: [
      'SDK sends POST /api/v1/offerings linked to the assetId from Step 02.',
      'Validates that tokenSymbol is alphanumeric and max 10 characters.',
      'Stores the tokenomics parameters in Postgres and assigns offering status: "draft".',
    ],
    invariants: [
      'Mathematical raise invariant: Target Raise = Token Supply * Token Price',
      'Strict foreign key binding to parent assetId',
      'Initial state set to draft pending compliance review and mint deployment',
    ],
    defaultInputs: {
      offeringName: 'Mayfair Plaza Series A',
      tokenSymbol: 'MFR',
      targetRaise: 4500000,
      tokenSupply: 450000,
      tokenPrice: 10,
    },
    sdkSnippet: (inputs, state) =>
      `// Structure offering terms and Token-2022 tokenomics
const offering = await rwa.offerings.create({
  assetId: ${state.assetId || 1}, // Linked to Asset #${state.assetId || 1}
  name: "${inputs.offeringName || 'Mayfair Plaza Series A'}",
  targetRaise: ${inputs.targetRaise || 4500000},
  minInvestment: 1000,
  tokenName: "Mayfair RWA Token",
  tokenSymbol: "${inputs.tokenSymbol || 'MFR'}",
  tokenSupply: ${inputs.tokenSupply || 450000},
  tokenPrice: ${inputs.tokenPrice || 10},
});

console.log("Created Offering ID:", offering.id);`,
  },
  {
    id: 'step-mint',
    stepNumber: '04',
    name: 'Atomic Solana SPL Token-2022 Mint Deployment',
    shortDesc: 'Initialize on-chain Token-2022 mint with MetadataPointer',
    objective:
      'You are testing rwa.offerings.deployToken(offeringId) (which invokes POST /offerings/:id/status with deployToken: true). This executes an atomic Solana transaction that initializes an SPL Token-2022 mint on Solana Devnet with an embedded MetadataPointer extension and mints the initial token supply into treasury custody.',
    underTheHood: [
      'Generates a fresh Solana mint Keypair and calculates rent-exempt lamports for ExtensionType.MetadataPointer + TLV metadata.',
      'Executes an atomic Solana transaction containing createAccount, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, and createInitializeInstruction.',
      'Provisions the issuer treasury Associated Token Account (ATA) and mints initialSupply into custody.',
      'Transitions offering status to "open" and persists mintAddress & txSignature in Postgres.',
    ],
    invariants: [
      'Program ID: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb (Token-2022)',
      'Embedded on-chain metadata (eliminates external Metaplex accounts)',
      '100% of supply minted directly into treasury Associated Token Account (ATA)',
    ],
    defaultInputs: {},
    sdkSnippet: (_, state) =>
      `// Atomically deploy the SPL Token-2022 mint on Solana Devnet
const result = await rwa.offerings.deployToken(${state.offeringId || 1});

console.log("Deployed Mint Address:", result.tokenDeployment?.mintAddress);
console.log("Solana Explorer:", result.tokenDeployment?.solanaExplorerUrl);`,
  },
  {
    id: 'step-investor',
    stepNumber: '05',
    name: 'Investor Profile Onboarding',
    shortDesc: 'Register investor entity identity prior to KYC verification',
    objective:
      'You are testing rwa.investors.create() to onboard an investor or fund entity into your organization’s Investor Registry. This establishes their legal identity, contact email, and regulatory classification tier prior to running compliance checks.',
    underTheHood: [
      'SDK sends POST /api/v1/investors with legal entity name, email, and classification.',
      'Postgres inserts the investor record with kycStatus initialized to "pending".',
      'The investor profile is strictly scoped to your organization workspace.',
    ],
    invariants: [
      'Unique email deduplication check',
      'Default kycStatus initialized to "pending"',
      'Multi-tenant workspace isolation enforced',
    ],
    defaultInputs: {
      investorName: 'Aether Capital Partners LP',
      investorEmail: 'treasury@aether-lp.io',
      investorType: 'institutional',
      jurisdiction: 'US',
    },
    sdkSnippet: (inputs, _) =>
      `// Onboard an investor or fund profile
const investor = await rwa.investors.create({
  name: "${inputs.investorName || 'Aether Capital Partners LP'}",
  email: "${inputs.investorEmail || 'treasury@aether-lp.io'}",
  investorType: "${inputs.investorType || 'institutional'}",
  jurisdiction: "${inputs.jurisdiction || 'US'}",
  kycStatus: "pending",
});

console.log("Created Investor ID:", investor.id);`,
  },
  {
    id: 'step-kyc',
    stepNumber: '06',
    name: 'Investor KYC Verification & Solana Wallet Whitelist',
    shortDesc: 'Attest accreditation, whitelist wallet, and compute settlement eligibility',
    objective:
      'You are testing the dedicated KYC endpoint via rwa.investors.verifyKyc(investorId, ...). This is the compliance gate that decides whether an investor is legally permitted to receive regulated SPL Token-2022 units on Solana. You are verifying their identity, attesting their accreditation (Rule 506(c)), binding their Base58 Solana wallet, and confirming that the server returns eligibleForSettlement: true.',
    underTheHood: [
      'SDK sends POST /api/v1/investors/:investorId/kyc with kycStatus: "approved", walletAddress, and external verification metadata.',
      'Postgres updates the investor row and records the whitelisted Solana address.',
      'The server evaluates complianceChecks (identityVerified, accreditationAttested, sanctionsScreened, walletWhitelisted) and returns eligibleForSettlement: true.',
    ],
    invariants: [
      'kycStatus must be "approved" and valid wallet address present for eligibleForSettlement: true',
      'Wallet must be a valid Solana Base58 public key',
      'Rejection or suspension will block subsequent /settle calls with 403 KYC_NOT_APPROVED',
    ],
    defaultInputs: {
      walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      provider: 'sumsub',
      referenceId: 'inq_lab_009841',
    },
    sdkSnippet: (inputs, state) =>
      `// Verify KYC, attest accreditation & whitelist their Solana wallet
const kyc = await rwa.investors.verifyKyc(${state.investorId || 1}, {
  kycStatus: "approved",
  investorType: "qualified_purchaser",
  jurisdiction: "US",
  walletAddress: "${inputs.walletAddress || 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX'}",
  provider: "${inputs.provider || 'sumsub'}",
  referenceId: "${inputs.referenceId || 'inq_lab_009841'}",
  notes: "SEC Rule 506(c) CPA attestation letter verified; OFAC cleared.",
});

console.log("Eligible for on-chain settlement:", kyc.eligibleForSettlement);`,
  },
  {
    id: 'step-settle',
    stepNumber: '07',
    name: 'Primary Subscription & On-Chain Solana Settlement',
    shortDesc: 'Record commitment, verify KYC gate, and transfer Token-2022 units to investor ATA',
    objective:
      'You are testing the two-phase settlement protocol using rwa.subscriptions.create() followed by rwa.subscriptions.settle(). First, a subscription commitment is recorded. Then, the settle endpoint checks the investor’s KYC gate, deterministically provisions the investor’s Associated Token Account (ATA) on Solana Devnet, and transfers the allocated Token-2022 units from treasury custody. If called twice, it idempotently returns the confirmed signature without double-minting.',
    underTheHood: [
      'rwa.subscriptions.create() records the commitment, computes tokenQuantity = floor(amountUsd / tokenPrice), and validates against unallocated supply.',
      'rwa.subscriptions.settle() verifies that the investor is NOT rejected or suspended.',
      'Derives the investor Associated Token Account (ATA) on Solana for the Token-2022 mint.',
      'Dispatches createTransferCheckedInstruction or createMintToInstruction on Solana Devnet and records the confirmed txSignature.',
    ],
    invariants: [
      'KYC Compliance Gate: Wallets with rejected/suspended KYC are blocked with 403 KYC_NOT_APPROVED',
      'Idempotent Replay Safety: Re-running /settle on an already settled subscription returns idempotentReplay: true without sending extra tokens',
      'Hard supply ceiling: Cannot exceed tokenSupply',
    ],
    defaultInputs: {
      amountUsd: 5000,
    },
    sdkSnippet: (inputs, state) =>
      `// 1. Record primary subscription commitment ($5,000 = 500 MFR tokens)
const sub = await rwa.subscriptions.create(${state.offeringId || 1}, {
  investorWallet: "${state.walletAddress || 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX'}",
  amountUsd: ${inputs.amountUsd || 5000},
});

// 2. Settle on Solana Devnet (provisions ATA & delivers Token-2022 units)
const settled = await rwa.subscriptions.settle(sub.id);

console.log("Settlement Status:", settled.subscription.status);
console.log("Solana Explorer:", settled.solanaExplorerUrl);`,
  },
  {
    id: 'step-yield',
    stepNumber: '08',
    name: 'Cap Table Reconciliation & Pro-Rata Yield Engine',
    shortDesc: 'Inspect settled on-chain ownership & calculate pro-rata yield payouts',
    objective:
      'You are testing post-issuance cap table reconciliation via rwa.offerings.getHoldings() and the pure Solana mathematical distribution engine calculateProRataDistribution() from @3rdfloor/sdk/solana. This calculates each holder’s exact dollar payout from a distribution pool (e.g. $25,000 quarterly rental yield) based on their settled token ownership percentage.',
    underTheHood: [
      'rwa.offerings.getHoldings() aggregates all settled subscriptions and computes each wallet’s ownership percentage of circulating supply.',
      'calculateProRataDistribution() runs the deterministic invariant: Payout = Pool * (Holder Tokens / Total Allocated Tokens) with zero float drift.',
      'Outputs exact per-wallet entitlement schedules with 4-decimal share percentages and 2-decimal USD amounts.',
    ],
    invariants: [
      'Reconciles on-chain balances with verified legal identities',
      'Distribution pool is 100% allocated with zero rounding leakage',
      'Pure mathematical function executed locally via @3rdfloor/sdk/solana',
    ],
    defaultInputs: {
      totalPoolUsd: 25000,
    },
    sdkSnippet: (inputs, state) =>
      `import { calculateProRataDistribution } from '@3rdfloor/sdk/solana';

// 1. Query reconciled on-chain token holder cap table
const capTable = await rwa.offerings.getHoldings(${state.offeringId || 1});
console.log("Settled Holders Count:", capTable.holders.length);

// 2. Calculate pro-rata quarterly rental yield distribution ($25,000 pool)
const entitlements = calculateProRataDistribution(
  ${inputs.totalPoolUsd || 25000},
  capTable.holders
);

entitlements.forEach((e) => {
  console.log(\`Wallet: \${e.investorWallet} | Share: \${e.sharePercentage}% | Payout: $\${e.payoutAmountUsd}\`);
});`,
  },
];

export default function SdkTestLabPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [apiKey, setApiKey] = useState('3f_live_9a8b7c6d5e4f3a2b1c0d9e8f');
  const [customInputs, setCustomInputs] = useState<Record<string, any>>({});
  const [pipelineState, setPipelineState] = useState<Record<string, any>>({
    assetId: 1,
    offeringId: 1,
    investorId: 1,
    walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  });

  const [stepResults, setStepResults] = useState<
    Record<StepId, StepExecutionResult | undefined>
  >({} as any);
  const [runningStepId, setRunningStepId] = useState<StepId | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const currentStep = STEPS[activeStepIndex];
  const currentResult = stepResults[currentStep.id];

  const effectiveInputs = {
    ...currentStep.defaultInputs,
    ...(customInputs[currentStep.id] || {}),
  };

  function handleInputChange(key: string, value: any) {
    setCustomInputs((prev) => ({
      ...prev,
      [currentStep.id]: {
        ...(prev[currentStep.id] || {}),
        [key]: value,
      },
    }));
  }

  async function runStep(step: StepDefinition): Promise<StepExecutionResult> {
    setRunningStepId(step.id);
    const inputs = {
      ...step.defaultInputs,
      ...(customInputs[step.id] || {}),
    };

    try {
      const res = await executeSdkStep({
        stepId: step.id,
        apiKey: apiKey.trim(),
        inputs,
        pipelineState,
      });

      setStepResults((prev) => ({ ...prev, [step.id]: res }));
      if (res.updatedState) {
        setPipelineState((prev) => ({ ...prev, ...res.updatedState }));
      }
      return res;
    } finally {
      setRunningStepId(null);
    }
  }

  async function handleRunCurrentStep() {
    await runStep(currentStep);
  }

  async function handleRunAllSteps() {
    setIsRunningAll(true);
    for (let i = 0; i < STEPS.length; i++) {
      setActiveStepIndex(i);
      const step = STEPS[i];
      const res = await runStep(step);
      if (!res.success) {
        break; // stop on failure
      }
      // Small visual pause between steps so user sees progression
      await new Promise((r) => setTimeout(r, 350));
    }
    setIsRunningAll(false);
  }

  function handleReset() {
    setStepResults({} as any);
    setActiveStepIndex(0);
    setPipelineState({
      assetId: 1,
      offeringId: 1,
      investorId: 1,
      walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    });
  }

  const passedCount = Object.values(stepResults).filter((r) => r?.success).length;

  return (
    <div className="min-h-dvh flex flex-col bg-white text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white">
      {/* =====================================================================
          TOP NAVIGATION BAR
          ===================================================================== */}
      <header className="sticky top-0 z-30 h-16 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-full px-6 sm:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-[18px] font-medium tracking-[-0.025em] text-[#0A0A0A]"
            >
              3rdfloor
            </Link>
            <span className="text-[#D4D4D8] text-sm">/</span>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-medium text-[#0A0A0A]">
                SDK Test Lab
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-[#F4F4F5] border border-[#E4E4E7] text-[#0A0A0A]">
                @3rdfloor/sdk
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[13.5px]">
            <Link
              href="/docs"
              className="text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/docs#api-sandbox"
              className="text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              API Sandbox
            </Link>
            <Link
              href="/explore"
              className="text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              Marketplace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-[12px] font-mono text-[#525252]">
              <span className="size-2 rounded-full bg-[#10B981]" />
              <span>Devnet Live</span>
            </div>
            <Link
              href="/dashboard"
              className="h-9 px-4 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[13px] font-normal flex items-center justify-center transition-colors"
            >
              Workspace &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          PIPELINE HEADER & ACTION CONTROLS
          ===================================================================== */}
      <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] py-8 px-6 sm:px-10">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-[12px] font-mono text-[#737373]">
                <Sparkles className="size-3.5 text-[#0A0A0A]" />
                <span>INTERACTIVE END-TO-END RWA WORKBENCH</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.025em] text-[#0A0A0A]">
                Step-by-Step SDK Verification Lab
              </h1>
              <p className="text-[14.5px] text-[#525252] leading-[1.6]">
                Test the complete 3rdfloor lifecycle in real time. Each step below
                tells you exactly <strong className="text-[#0A0A0A]">what you are testing</strong>,
                the financial invariants being checked, and how off-chain compliance
                gates on-chain SPL Token-2022 settlement on Solana.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <button
                type="button"
                onClick={handleRunAllSteps}
                disabled={isRunningAll || runningStepId !== null}
                className="h-10 px-5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[13.5px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Play className="size-3.5 fill-current" />
                <span>{isRunningAll ? 'Running All Steps...' : 'Run All 8 Steps'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-4 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[13px] text-[#525252] hover:text-[#0A0A0A] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Lab</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
            {STEPS.map((step, idx) => {
              const res = stepResults[step.id];
              const isActive = activeStepIndex === idx;
              const isRunning = runningStepId === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#0A0A0A] bg-white ring-2 ring-[#0A0A0A]/10 shadow-sm'
                      : 'border-[#E5E5E5] bg-white/70 hover:bg-white hover:border-[#D4D4D8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-[#737373]">
                      {step.stepNumber}
                    </span>
                    {isRunning ? (
                      <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                    ) : res?.success ? (
                      <span className="size-4 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-[10px]">
                        <Check className="size-2.5" />
                      </span>
                    ) : res && !res.success ? (
                      <span className="size-2 rounded-full bg-red-500" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-[#D4D4D8]" />
                    )}
                  </div>
                  <div className="text-[12.5px] font-medium text-[#0A0A0A] truncate">
                    {step.name.split(':')[0]}
                  </div>
                  <div className="text-[10.5px] text-[#737373] mt-0.5 truncate">
                    {res ? `${res.latencyMs}ms` : 'Ready'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN SPLIT-PANE LAB WORKBENCH
          ===================================================================== */}
      <main className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row border-b border-[#E5E5E5]">
        {/* Left Navigator Rail */}
        <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] p-6 bg-white space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-[#737373] uppercase tracking-wider">
              Test Pipeline Stages ({passedCount}/8 Passed)
            </div>
            <div className="text-[13px] text-[#525252]">
              Select any stage below to inspect what is being tested:
            </div>
          </div>

          <nav className="space-y-1.5">
            {STEPS.map((step, idx) => {
              const res = stepResults[step.id];
              const isSelected = activeStepIndex === idx;
              const isRunning = runningStepId === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-[#0A0A0A] bg-[#FAFAFA] font-medium'
                      : 'border-transparent hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#737373]">
                        Stage {step.stepNumber}
                      </span>
                      {res?.success && (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-[#E4E4E7] text-[#0A0A0A]">
                          PASSED
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#0A0A0A] truncate">
                      {step.name}
                    </div>
                  </div>

                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform mt-1 ${
                      isSelected ? 'text-[#0A0A0A] translate-x-0.5' : 'text-[#A1A1AA]'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Pipeline Context State Inspector */}
          <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
            <div className="text-[11.5px] font-mono uppercase tracking-wider text-[#737373] flex items-center justify-between">
              <span>Chained Pipeline State</span>
              <span className="size-1.5 rounded-full bg-[#10B981]" />
            </div>
            <div className="space-y-1.5 text-[12px] font-mono">
              <div className="flex justify-between">
                <span className="text-[#737373]">assetId:</span>
                <span className="text-[#0A0A0A]">#{pipelineState.assetId ?? 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">offeringId:</span>
                <span className="text-[#0A0A0A]">#{pipelineState.offeringId ?? 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">investorId:</span>
                <span className="text-[#0A0A0A]">#{pipelineState.investorId ?? 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">wallet:</span>
                <span className="text-[#0A0A0A] truncate max-w-[120px]">
                  {pipelineState.walletAddress ? `${pipelineState.walletAddress.slice(0, 8)}...` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">mint:</span>
                <span className="text-[#0A0A0A] truncate max-w-[120px]">
                  {pipelineState.mintAddress ? `${pipelineState.mintAddress.slice(0, 8)}...` : 'Not Minted'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Stage Detail & Execution Panel */}
        <section className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 space-y-10">
          {/* Stage Header */}
          <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold bg-[#0A0A0A] text-white">
                STAGE {currentStep.stepNumber} / 08
              </span>
              <span className="text-[13px] text-[#737373] font-mono">
                {currentStep.shortDesc}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-[#0A0A0A]">
              {currentStep.name}
            </h2>
          </div>

          {/* CARD 1: WHAT YOU ARE TESTING PER TIME */}
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 sm:p-7 space-y-6">
            <div className="flex items-center gap-2.5 text-[12.5px] font-mono text-[#0A0A0A] font-medium">
              <Terminal className="size-4" />
              <span>WHAT YOU ARE TESTING RIGHT NOW</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[15.5px] font-medium text-[#0A0A0A]">
                1. Objective &amp; Financial Mechanics
              </h3>
              <p className="text-[14.5px] text-[#404040] leading-[1.75]">
                {currentStep.objective}
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-[15.5px] font-medium text-[#0A0A0A]">
                2. What Executes Under the Hood
              </h3>
              <ul className="space-y-2 text-[14px] text-[#404040]">
                {currentStep.underTheHood.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="size-1.5 rounded-full bg-[#0A0A0A] mt-2 shrink-0" />
                    <span className="leading-[1.65]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-[15.5px] font-medium text-[#0A0A0A]">
                3. Regulatory &amp; Cryptographic Invariants Checked
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentStep.invariants.map((inv, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-[#E5E5E5] bg-white text-[13px] text-[#333333] flex items-center gap-2"
                  >
                    <Check className="size-3.5 text-[#0A0A0A] shrink-0" />
                    <span>{inv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 2: INPUTS & CUSTOMIZATION (IF ANY) */}
          {Object.keys(currentStep.defaultInputs).length > 0 && (
            <div className="space-y-4">
              <div className="text-[14px] font-medium text-[#0A0A0A]">
                Step Parameters &amp; Test Inputs
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(currentStep.defaultInputs).map(([key, defaultVal]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-[12px] font-mono text-[#737373]">
                      {key}
                    </label>
                    <input
                      type={typeof defaultVal === 'number' ? 'number' : 'text'}
                      value={effectiveInputs[key] ?? defaultVal}
                      onChange={(e) =>
                        handleInputChange(
                          key,
                          typeof defaultVal === 'number'
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] bg-white font-mono text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARD 3: THE EXACT SDK CODE */}
          <div className="space-y-3">
            <div className="text-[14px] font-medium text-[#0A0A0A]">
              SDK TypeScript Code Being Executed
            </div>
            <CodeBlock
              title={`Stage ${currentStep.stepNumber} · @3rdfloor/sdk`}
              language="typescript"
              code={currentStep.sdkSnippet(effectiveInputs, pipelineState)}
              surface="light"
            />
          </div>

          {/* RUN ACTION BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={handleRunCurrentStep}
              disabled={runningStepId !== null}
              className="h-11 px-7 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[14px] font-medium flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Play className="size-3.5 fill-current" />
              <span>
                {runningStepId === currentStep.id
                  ? 'Executing Step...'
                  : `Run Stage ${currentStep.stepNumber}`}
              </span>
            </button>

            {activeStepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => prev + 1)}
                className="h-11 px-5 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[13.5px] text-[#0A0A0A] flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Next: Stage {STEPS[activeStepIndex + 1].stepNumber}</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>

          {/* CARD 4: EXECUTION RESULTS CONSOLE */}
          {currentResult && (
            <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden space-y-0">
              <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-2.5 rounded-full ${
                      currentResult.success ? 'bg-[#10B981]' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[13.5px] font-medium text-[#0A0A0A]">
                    {currentResult.success
                      ? `Stage ${currentStep.stepNumber} Verified Successfully (${currentResult.latencyMs} ms)`
                      : `Stage ${currentStep.stepNumber} Execution Failed (${currentResult.latencyMs} ms)`}
                  </span>
                </div>

                {currentResult.output?.tokenDeployment?.solanaExplorerUrl && (
                  <a
                    href={currentResult.output.tokenDeployment.solanaExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] font-mono text-[#0A0A0A] hover:underline"
                  >
                    <span>View Mint on Solana Explorer</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
                {currentResult.output?.solanaExplorerUrl && (
                  <a
                    href={currentResult.output.solanaExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] font-mono text-[#0A0A0A] hover:underline"
                  >
                    <span>View Tx on Solana Explorer</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <div className="p-6 bg-white space-y-4">
                <div className="text-[13px] text-[#525252]">
                  <strong className="text-[#0A0A0A]">Summary:</strong>{' '}
                  {currentResult.whatWasTested}
                </div>

                <CodeBlock
                  title="Raw Execution Output (JSON)"
                  language="json"
                  code={JSON.stringify(
                    currentResult.output || currentResult.error,
                    null,
                    2
                  )}
                  surface="light"
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
