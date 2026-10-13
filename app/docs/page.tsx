'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { CodeBlock } from '@/components/code-block';
import {
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Coins,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Layers,
  Play,
  Search,
  Sparkles,
  Terminal,
  ArrowLeftRight,
  PieChart,
} from '@/components/docs-icons';

type TocItem = {
  id: string;
  label: string;
};

type EndpointParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type EndpointDoc = {
  id: string;
  category:
    | 'api-investors'
    | 'api-assets'
    | 'api-offerings'
    | 'api-subscriptions'
    | 'api-lifecycle';
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  pathParamName?: string;
  defaultPathParam?: string;
  summary: string;
  description: string;
  params?: EndpointParam[];
  sampleBody?: Record<string, unknown>;
  sampleResponse: Record<string, unknown>;
};

type DocPageItem = {
  id: string;
  group: 'Getting started' | 'Core mechanics' | 'REST API v1';
  groupIndex: '3F/01' | '3F/02' | '3F/03';
  title: string;
  icon:
    | 'book'
    | 'sparkles'
    | 'building'
    | 'layers'
    | 'coins'
    | 'key'
    | 'arrows'
    | 'pie'
    | 'terminal'
    | 'code';
  eyebrow: string;
  lead: string;
  children?: { id: string; label: string; method?: 'GET' | 'POST' | 'PATCH' }[];
  toc: TocItem[];
};

const ENDPOINTS: EndpointDoc[] = [
  {
    id: 'list-investors',
    category: 'api-investors',
    method: 'GET',
    path: '/api/v1/investors',
    summary: 'List organization investors & KYC registry',
    description:
      'Returns every registered and subscription-derived investor record scoped to your authenticated organization workspace. Each record is enriched with real-time KYC verification status, regulatory classification, ISO jurisdiction, and aggregated settled SPL Token-2022 holdings across all workspace offerings.',
    sampleResponse: {
      data: [
        {
          id: 1,
          organizationId: 1,
          name: 'Apex Institutional Partners LP',
          email: 'treasury@apex-lp.io',
          walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
          investorType: 'institutional',
          jurisdiction: 'US',
          kycStatus: 'approved',
          subscriptionsCount: 1,
          settledSubscriptionsCount: 1,
          totalInvestedUsd: 5000,
          totalTokensHeld: 500,
        },
      ],
      meta: { total: 1, timestamp: '2026-10-13T02:20:00.000Z' },
    },
  },
  {
    id: 'create-investor',
    category: 'api-investors',
    method: 'POST',
    path: '/api/v1/investors',
    summary: 'Onboard or upsert an investor profile',
    description:
      'Creates a new investor profile in your organization workspace or idempotently updates an existing record matched by email address or Solana wallet address. Use this endpoint when an investor creates an account in your portal before or during KYC verification.',
    params: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description:
          'Full legal name of the individual or registered corporate/fund entity.',
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        description:
          'Primary compliance and reporting email address used as a unique lookup key.',
      },
      {
        name: 'walletAddress',
        type: 'string',
        required: false,
        description:
          'Base58-encoded Solana public key where SPL Token-2022 Associated Token Accounts (ATAs) will be provisioned.',
      },
      {
        name: 'investorType',
        type: 'string',
        required: false,
        description:
          'Regulatory tier: individual | accredited | institutional | qualified_purchaser (defaults to accredited).',
      },
      {
        name: 'jurisdiction',
        type: 'string',
        required: false,
        description:
          'Two-letter ISO 3166-1 alpha-2 country code for Reg D / Reg S domicile checks (defaults to US).',
      },
      {
        name: 'kycStatus',
        type: 'string',
        required: false,
        description:
          'Initial KYC state: pending | approved | rejected | suspended (defaults to pending).',
      },
    ],
    sampleBody: {
      name: 'Apex Institutional Partners LP',
      email: 'treasury@apex-lp.io',
      walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      investorType: 'institutional',
      jurisdiction: 'US',
      kycStatus: 'pending',
    },
    sampleResponse: {
      data: {
        id: 1,
        organizationId: 1,
        name: 'Apex Institutional Partners LP',
        email: 'treasury@apex-lp.io',
        walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        investorType: 'institutional',
        jurisdiction: 'US',
        kycStatus: 'pending',
      },
      meta: { upserted: false, timestamp: '2026-10-13T02:21:00.000Z' },
    },
  },
  {
    id: 'get-investor-kyc',
    category: 'api-investors',
    method: 'GET',
    path: '/api/v1/investors/:investorId/kyc',
    pathParamName: 'investorId',
    defaultPathParam: '1',
    summary: 'Get investor KYC verification & settlement eligibility',
    description:
      'Retrieves the dedicated KYC compliance dossier for a single investor, including their current kycStatus, accreditation attestation, sanctions screening state, whitelisted Solana wallet address, and a computed eligibleForSettlement boolean that determines whether primary Token-2022 subscriptions can be settled on-chain.',
    sampleResponse: {
      data: {
        investorId: 1,
        organizationId: 1,
        name: 'Apex Institutional Partners LP',
        email: 'treasury@apex-lp.io',
        kycStatus: 'approved',
        investorType: 'institutional',
        jurisdiction: 'US',
        walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        eligibleForSettlement: true,
        complianceChecks: {
          identityVerified: true,
          accreditationAttested: true,
          sanctionsScreened: true,
          walletWhitelisted: true,
        },
        verification: {
          provider: '3rdfloor_compliance',
          referenceId: 'kyc_inv_1',
          notes: null,
          evaluatedAt: '2026-10-13T02:22:00.000Z',
        },
      },
      meta: { timestamp: '2026-10-13T02:22:00.000Z' },
    },
  },
  {
    id: 'submit-investor-kyc',
    category: 'api-investors',
    method: 'POST',
    path: '/api/v1/investors/:investorId/kyc',
    pathParamName: 'investorId',
    defaultPathParam: '1',
    summary: 'Submit or update investor KYC determination & wallet whitelist',
    description:
      'Dedicated KYC compliance endpoint for recording identity verification decisions, updating accreditation classifications, and binding a verified Solana wallet address. Call this endpoint from your compliance dashboard or directly from external KYC webhook handlers (e.g., Sumsub, Persona, Parallel Markets). Supports both POST and PATCH.',
    params: [
      {
        name: 'kycStatus',
        type: 'string',
        required: true,
        description:
          'Verification outcome: pending | approved | rejected | suspended. Setting rejected or suspended immediately blocks on-chain subscription settlement.',
      },
      {
        name: 'investorType',
        type: 'string',
        required: false,
        description:
          'Verified accreditation tier: individual | accredited | institutional | qualified_purchaser.',
      },
      {
        name: 'jurisdiction',
        type: 'string',
        required: false,
        description:
          'Verified two-letter ISO 3166-1 alpha-2 tax & legal domicile code (e.g., US, UK, SG, CH).',
      },
      {
        name: 'walletAddress',
        type: 'string',
        required: false,
        description:
          'Screened Solana Base58 wallet address to whitelist for SPL Token-2022 ATA settlement.',
      },
      {
        name: 'provider',
        type: 'string',
        required: false,
        description:
          'Identifier of the verification vendor or compliance workflow (e.g., sumsub, persona, parallel_markets, manual_review).',
      },
      {
        name: 'referenceId',
        type: 'string',
        required: false,
        description:
          'External inquiry or dossier ID from your KYC provider for audit trail correlation.',
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description:
          'Optional compliance officer memo or accreditation attestation note.',
      },
    ],
    sampleBody: {
      kycStatus: 'approved',
      investorType: 'qualified_purchaser',
      jurisdiction: 'US',
      walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      provider: 'sumsub',
      referenceId: 'inq_98a7b6c5d4e3',
      notes: 'Form D 506(c) accreditation letter & OFAC screening cleared.',
    },
    sampleResponse: {
      data: {
        investorId: 1,
        organizationId: 1,
        name: 'Apex Institutional Partners LP',
        email: 'treasury@apex-lp.io',
        kycStatus: 'approved',
        investorType: 'qualified_purchaser',
        jurisdiction: 'US',
        walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        eligibleForSettlement: true,
        complianceChecks: {
          identityVerified: true,
          accreditationAttested: true,
          sanctionsScreened: true,
          walletWhitelisted: true,
        },
        verification: {
          provider: 'sumsub',
          referenceId: 'inq_98a7b6c5d4e3',
          notes: 'Form D 506(c) accreditation letter & OFAC screening cleared.',
          evaluatedAt: '2026-10-13T02:23:00.000Z',
        },
      },
      meta: { timestamp: '2026-10-13T02:23:00.000Z' },
    },
  },
  {
    id: 'get-investor',
    category: 'api-investors',
    method: 'GET',
    path: '/api/v1/investors/:investorId',
    pathParamName: 'investorId',
    defaultPathParam: '1',
    summary: 'Get investor profile & subscription history',
    description:
      'Retrieves an investor’s full registry profile alongside all pending and settled primary subscriptions across your organization’s offerings.',
    sampleResponse: {
      data: {
        id: 1,
        organizationId: 1,
        name: 'Apex Institutional Partners LP',
        email: 'treasury@apex-lp.io',
        walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        investorType: 'qualified_purchaser',
        jurisdiction: 'US',
        kycStatus: 'approved',
        subscriptions: [
          {
            id: 12,
            offeringId: 1,
            offeringName: 'Mayfair Plaza Series A',
            tokenSymbol: 'MFR',
            investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
            amountUsd: '5000',
            tokenQuantity: '500',
            status: 'settled',
            transactionSignature: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          },
        ],
      },
      meta: { timestamp: '2026-10-13T02:24:00.000Z' },
    },
  },
  {
    id: 'update-investor',
    category: 'api-investors',
    method: 'PATCH',
    path: '/api/v1/investors/:investorId',
    pathParamName: 'investorId',
    defaultPathParam: '1',
    summary: 'Update general investor profile attributes',
    description:
      'Partially updates an investor’s legal name, destination Solana wallet address, regulatory classification, jurisdiction, or KYC state.',
    params: [
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'Updated legal name or entity title.',
      },
      {
        name: 'walletAddress',
        type: 'string',
        required: false,
        description: 'Updated Base58 Solana wallet address.',
      },
      {
        name: 'investorType',
        type: 'string',
        required: false,
        description:
          'Updated classification (individual, accredited, institutional, qualified_purchaser).',
      },
      {
        name: 'jurisdiction',
        type: 'string',
        required: false,
        description: 'Updated ISO 3166-1 alpha-2 jurisdiction code.',
      },
      {
        name: 'kycStatus',
        type: 'string',
        required: false,
        description: 'Updated KYC state (pending, approved, rejected, suspended).',
      },
    ],
    sampleBody: {
      walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      jurisdiction: 'CH',
    },
    sampleResponse: {
      data: {
        id: 1,
        name: 'Apex Institutional Partners LP',
        email: 'treasury@apex-lp.io',
        walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        investorType: 'qualified_purchaser',
        jurisdiction: 'CH',
        kycStatus: 'approved',
      },
      meta: { timestamp: '2026-10-13T02:25:00.000Z' },
    },
  },
  {
    id: 'list-assets',
    category: 'api-assets',
    method: 'GET',
    path: '/api/v1/assets',
    summary: 'List registered real-world assets',
    description:
      'Returns all underlying physical or financial assets cataloged under your authenticated organization workspace, ordered newest first.',
    sampleResponse: {
      data: [
        {
          id: 1,
          organizationId: 1,
          name: 'Mayfair Commercial Plaza',
          category: 'Real Estate',
          declaredValuation: '4500000',
          currency: 'USD',
          status: 'verified',
        },
      ],
      meta: { total: 1, timestamp: '2026-10-13T00:15:00.000Z' },
    },
  },
  {
    id: 'create-asset',
    category: 'api-assets',
    method: 'POST',
    path: '/api/v1/assets',
    summary: 'Register a new real-world asset',
    description:
      'Catalogs an underlying physical or financial asset in your organization workspace so it can back one or more tokenized investment offerings.',
    params: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Legal or commercial name of the underlying asset or SPV.',
      },
      {
        name: 'category',
        type: 'string',
        required: true,
        description:
          'Asset class (Real Estate, Private Credit, Fine Art, Infrastructure).',
      },
      {
        name: 'declaredValuation',
        type: 'number',
        required: false,
        description: 'Latest appraised Net Asset Value (NAV).',
      },
      {
        name: 'currency',
        type: 'string',
        required: false,
        description: 'ISO valuation currency code (defaults to USD).',
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Collateral summary, legal structure, and custody details.',
      },
    ],
    sampleBody: {
      name: 'Mayfair Commercial Plaza',
      category: 'Real Estate',
      declaredValuation: 4500000,
      currency: 'USD',
      description: 'Class-A commercial office complex held via Delaware SPV.',
    },
    sampleResponse: {
      data: {
        id: 2,
        organizationId: 1,
        name: 'Mayfair Commercial Plaza',
        category: 'Real Estate',
        declaredValuation: '4500000',
        currency: 'USD',
        status: 'draft',
      },
      meta: { timestamp: '2026-10-13T00:16:00.000Z' },
    },
  },
  {
    id: 'get-asset',
    category: 'api-assets',
    method: 'GET',
    path: '/api/v1/assets/:assetId',
    pathParamName: 'assetId',
    defaultPathParam: '1',
    summary: 'Get asset details & linked offerings',
    description:
      'Retrieves a single real-world asset by ID along with its valuation metadata and all investment offerings structured against it.',
    sampleResponse: {
      data: {
        id: 1,
        organizationId: 1,
        name: 'Mayfair Commercial Plaza',
        category: 'Real Estate',
        declaredValuation: '4500000',
        currency: 'USD',
        offerings: [
          {
            id: 1,
            name: 'Mayfair Plaza Series A',
            tokenSymbol: 'MFR',
            status: 'open',
          },
        ],
      },
      meta: { timestamp: '2026-10-13T00:18:00.000Z' },
    },
  },
  {
    id: 'list-offerings',
    category: 'api-offerings',
    method: 'GET',
    path: '/api/v1/offerings',
    summary: 'List offerings & Token-2022 mint records',
    description:
      'Returns all investment offerings for the organization workspace, enriched with underlying asset records and deployed Solana SPL Token-2022 mint addresses.',
    sampleResponse: {
      data: [
        {
          id: 1,
          assetId: 1,
          name: 'Mayfair Plaza Series A',
          targetRaise: '4500000',
          tokenName: 'Mayfair RWA Token',
          tokenSymbol: 'MFR',
          tokenSupply: '450000',
          tokenPrice: '10',
          status: 'open',
          tokens: [
            {
              mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
              decimals: 6,
            },
          ],
        },
      ],
      meta: { total: 1, timestamp: '2026-10-13T00:20:00.000Z' },
    },
  },
  {
    id: 'create-offering',
    category: 'api-offerings',
    method: 'POST',
    path: '/api/v1/offerings',
    summary: 'Create an offering & configure tokenomics',
    description:
      'Creates a new investment offering linked to an existing asset in your workspace and defines its SPL Token-2022 supply, unit price, and raise targets.',
    params: [
      {
        name: 'assetId',
        type: 'number',
        required: true,
        description: 'ID of the underlying registered asset in your organization.',
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Commercial title of the tranche or investment offering.',
      },
      {
        name: 'targetRaise',
        type: 'number',
        required: true,
        description: 'Total capital raise target in USD.',
      },
      {
        name: 'tokenSymbol',
        type: 'string',
        required: true,
        description: 'On-chain ticker symbol (up to 10 uppercase characters).',
      },
      {
        name: 'tokenSupply',
        type: 'number',
        required: true,
        description: 'Total maximum SPL Token-2022 supply to mint into treasury.',
      },
      {
        name: 'tokenPrice',
        type: 'number',
        required: true,
        description: 'Issue price per token unit in USD.',
      },
    ],
    sampleBody: {
      assetId: 1,
      name: 'Mayfair Plaza Series A',
      targetRaise: 4500000,
      minInvestment: 1000,
      tokenName: 'Mayfair RWA Token',
      tokenSymbol: 'MFR',
      tokenSupply: 450000,
      tokenPrice: 10,
    },
    sampleResponse: {
      data: {
        id: 2,
        assetId: 1,
        name: 'Mayfair Plaza Series A',
        tokenSymbol: 'MFR',
        tokenSupply: '450000',
        tokenPrice: '10',
        status: 'draft',
      },
      meta: { timestamp: '2026-10-13T00:22:00.000Z' },
    },
  },
  {
    id: 'update-offering-status',
    category: 'api-offerings',
    method: 'POST',
    path: '/api/v1/offerings/:offeringId/status',
    pathParamName: 'offeringId',
    defaultPathParam: '1',
    summary: 'Transition status & deploy Solana Token-2022 mint',
    description:
      'Transitions an offering’s lifecycle state (draft, under_review, approved, open, paused, closed). Passing deployToken: true atomically initializes the SPL Token-2022 mint with an embedded MetadataPointer extension on Solana Devnet and mints the initial supply into treasury custody.',
    params: [
      {
        name: 'status',
        type: 'string',
        required: true,
        description:
          'Target state: draft | under_review | approved | open | paused | closed.',
      },
      {
        name: 'deployToken',
        type: 'boolean',
        required: false,
        description:
          'When true, deploys the SPL Token-2022 mint on Solana Devnet if not yet initialized.',
      },
    ],
    sampleBody: {
      status: 'open',
      deployToken: true,
    },
    sampleResponse: {
      data: {
        offering: { id: 1, status: 'open' },
        tokenDeployment: {
          mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          txSignature: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
          solanaExplorerUrl:
            'https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet',
        },
      },
      meta: { timestamp: '2026-10-13T00:25:00.000Z' },
    },
  },
  {
    id: 'create-subscription',
    category: 'api-subscriptions',
    method: 'POST',
    path: '/api/v1/offerings/:offeringId/subscriptions',
    pathParamName: 'offeringId',
    defaultPathParam: '1',
    summary: 'Record a primary investor subscription commitment',
    description:
      'Records an investor commitment against an open offering, computes the token allocation from the offering’s tokenPrice, and enforces a hard supply guard against remaining unallocated tokens.',
    params: [
      {
        name: 'investorWallet',
        type: 'string',
        required: true,
        description:
          'Destination Solana Base58 wallet address to receive the Token-2022 allocation.',
      },
      {
        name: 'amountUsd',
        type: 'number',
        required: true,
        description: 'Committed capital amount in USD.',
      },
      {
        name: 'investorEmail',
        type: 'string',
        required: false,
        description:
          'Investor email address to correlate with the organization’s Investor & KYC Registry.',
      },
    ],
    sampleBody: {
      investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
      amountUsd: 5000,
      investorEmail: 'treasury@apex-lp.io',
    },
    sampleResponse: {
      data: {
        id: 12,
        offeringId: 1,
        investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
        amountUsd: '5000',
        tokenQuantity: '500',
        status: 'pending',
      },
      meta: { timestamp: '2026-10-13T00:28:00.000Z' },
    },
  },
  {
    id: 'settle-subscription',
    category: 'api-subscriptions',
    method: 'POST',
    path: '/api/v1/subscriptions/:subscriptionId/settle',
    pathParamName: 'subscriptionId',
    defaultPathParam: '12',
    summary: 'Settle subscription & transfer Token-2022 to investor ATA',
    description:
      'Verifies that the investor is not KYC-rejected or suspended, deterministically provisions their Associated Token Account (ATA) on Solana Devnet, and transfers the allocated SPL Token-2022 units from the offering treasury. Strictly idempotent across network retries.',
    sampleResponse: {
      data: {
        subscription: {
          id: 12,
          status: 'settled',
          investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
          tokenQuantity: '500',
          transactionSignature: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
        },
        solanaExplorerUrl:
          'https://explorer.solana.com/tx/4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM?cluster=devnet',
      },
      meta: { timestamp: '2026-10-13T00:30:00.000Z' },
    },
  },
  {
    id: 'get-holdings',
    category: 'api-lifecycle',
    method: 'GET',
    path: '/api/v1/offerings/:offeringId/holdings',
    pathParamName: 'offeringId',
    defaultPathParam: '1',
    summary: 'Get reconciled on-chain token holder cap table',
    description:
      'Returns the reconciled cap table of all settled token holders for an offering, including wallet addresses, cumulative token balances, fractional ownership percentages, and Solana Devnet transaction proofs.',
    sampleResponse: {
      data: {
        offeringId: 1,
        mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        totalSupply: 450000,
        allocatedTokens: 500,
        holders: [
          {
            investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
            tokenBalance: 500,
            ownershipPercentage: 0.1111,
          },
        ],
      },
      meta: { timestamp: '2026-10-13T00:32:00.000Z' },
    },
  },
  {
    id: 'create-distribution',
    category: 'api-lifecycle',
    method: 'POST',
    path: '/api/v1/offerings/:offeringId/distributions',
    pathParamName: 'offeringId',
    defaultPathParam: '1',
    summary: 'Declare & execute a pro-rata yield distribution',
    description:
      'Snapshots the reconciled token holder cap table for an offering, records a USD dividend or rental yield distribution pool, and computes exact pro-rata payout entitlements for every settled holder.',
    params: [
      {
        name: 'title',
        type: 'string',
        required: true,
        description:
          'Distribution title or accounting period label (e.g., Q4 2026 Commercial Rental Yield).',
      },
      {
        name: 'totalAmountUsd',
        type: 'number',
        required: true,
        description:
          'Total USD payout pool to distribute pro-rata across settled token holders.',
      },
    ],
    sampleBody: {
      title: 'Q4 2026 Rental Yield Payout',
      totalAmountUsd: 25000,
    },
    sampleResponse: {
      data: {
        distribution: {
          id: 1,
          offeringId: 1,
          title: 'Q4 2026 Rental Yield Payout',
          totalAmountUsd: '25000',
          status: 'executed',
        },
        entitlements: [
          {
            investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
            tokenQuantity: 500,
            sharePercentage: 100,
            payoutAmountUsd: 25000,
          },
        ],
      },
      meta: { timestamp: '2026-10-13T00:35:00.000Z' },
    },
  },
];

const DOC_PAGES: DocPageItem[] = [
  {
    id: 'platform-overview',
    group: 'Getting started',
    groupIndex: '3F/01',
    title: 'Architecture & quickstart',
    icon: 'book',
    eyebrow: 'Getting started · System overview',
    lead: 'Understand how 3rdfloor bridges off-chain Special Purpose Vehicle (SPV) compliance and investor KYC with programmable SPL Token-2022 issuance and settlement on Solana.',
    toc: [
      { id: 'dual-ledger-model', label: 'Dual-ledger architecture' },
      { id: 'lifecycle-roadmap', label: 'The 5-stage issuance pipeline' },
      { id: 'quick-env-setup', label: 'Quickstart & first API call' },
      { id: 'api-conventions', label: 'Conventions & status codes' },
    ],
  },
  {
    id: 'organizations-kyb',
    group: 'Getting started',
    groupIndex: '3F/01',
    title: '1. Organizations & KYB',
    icon: 'building',
    eyebrow: 'Getting started · Step 01',
    lead: 'Provision a multi-tenant issuer workspace, submit SPV corporate verification documents, and understand how KYB status gates on-chain Solana mint deployment.',
    toc: [
      { id: 'why-workspaces', label: 'Why issuer workspaces exist' },
      { id: 'creating-org', label: 'Provisioning & KYB walkthrough' },
      { id: 'kyb-matrix', label: 'KYB compliance gate matrix' },
      { id: 'workspace-isolation', label: 'Multi-tenant isolation model' },
    ],
  },
  {
    id: 'asset-registration',
    group: 'Getting started',
    groupIndex: '3F/01',
    title: '2. Registering assets',
    icon: 'layers',
    eyebrow: 'Getting started · Step 02',
    lead: 'Catalog underlying real-world collateral—Commercial Real Estate, Private Credit, Fine Art, or Infrastructure—and establish the Net Asset Value (NAV) baseline for your offerings.',
    toc: [
      { id: 'asset-offering-separation', label: 'The 1:N asset-to-offering model' },
      { id: 'register-asset-call', label: 'Registering an asset via API' },
      { id: 'asset-classes', label: 'Supported institutional asset classes' },
    ],
  },
  {
    id: 'offerings-tokenomics',
    group: 'Getting started',
    groupIndex: '3F/01',
    title: '3. Offerings & Token-2022',
    icon: 'coins',
    eyebrow: 'Getting started · Step 03',
    lead: 'Structure investment tranches, enforce mathematical tokenomics invariants, and atomically initialize SPL Token-2022 mints with embedded on-chain metadata.',
    toc: [
      { id: 'two-step-offering', label: 'Structuring offering tokenomics' },
      { id: 'why-token-2022', label: 'Why Solana SPL Token-2022' },
      { id: 'token-2022-mint', label: 'Atomic mint initialization' },
      { id: 'offering-lifecycle', label: 'Offering state machine' },
    ],
  },
  {
    id: 'authentication-keys',
    group: 'Core mechanics',
    groupIndex: '3F/02',
    title: 'API keys & security',
    icon: 'key',
    eyebrow: 'Core mechanics · Authentication',
    lead: 'Issue workspace-scoped 3f_live_... secret keys, authenticate headless server requests, and inspect our zero-plaintext SHA-256 verification pipeline.',
    toc: [
      { id: 'generating-keys', label: 'Issuing workspace secret keys' },
      { id: 'auth-headers', label: 'Authentication headers' },
      { id: 'sha256-storage', label: 'Zero-plaintext SHA-256 architecture' },
      { id: 'key-rotation', label: 'Rotation & operational security' },
    ],
  },
  {
    id: 'investors-kyc',
    group: 'Core mechanics',
    groupIndex: '3F/02',
    title: 'Investor KYC & whitelisting',
    icon: 'building',
    eyebrow: 'Core mechanics · Compliance & KYC',
    lead: 'Onboard accredited and institutional investors, execute identity & accreditation checks via the dedicated /kyc endpoint, and whitelist Solana wallets for Token-2022 settlement.',
    toc: [
      { id: 'kyc-architecture', label: 'How investor KYC gates settlement' },
      { id: 'onboarding-investors', label: 'Step 1: Onboarding an investor' },
      { id: 'verifying-kyc-endpoint', label: 'Step 2: Calling the /kyc endpoint' },
      { id: 'kyc-classifications', label: 'Accreditation tiers & KYC states' },
      { id: 'kyc-webhook-pattern', label: 'Connecting Sumsub / Persona webhooks' },
    ],
  },
  {
    id: 'subscriptions-settlement',
    group: 'Core mechanics',
    groupIndex: '3F/02',
    title: 'Subscriptions & settlement',
    icon: 'arrows',
    eyebrow: 'Core mechanics · On-chain settlement',
    lead: 'Decouple off-chain fiat/stablecoin subscription commitments from deterministic, idempotent SPL Token-2022 Associated Token Account (ATA) delivery on Solana.',
    toc: [
      { id: 'why-two-phase', label: 'Why commitment & settlement are decoupled' },
      { id: 'two-phase-settlement', label: 'Two-phase settlement walkthrough' },
      { id: 'idempotency-guarantees', label: 'Idempotency, KYC & supply guards' },
    ],
  },
  {
    id: 'captable-distributions',
    group: 'Core mechanics',
    groupIndex: '3F/02',
    title: 'Cap table & distributions',
    icon: 'pie',
    eyebrow: 'Core mechanics · Post-issuance lifecycle',
    lead: 'Reconcile settled on-chain SPL Token-2022 balances against verified legal identities and execute automated pro-rata USD yield distributions.',
    toc: [
      { id: 'reconciled-captable', label: 'Continuous cap table reconciliation' },
      { id: 'pro-rata-payouts', label: 'Pro-rata yield calculation engine' },
    ],
  },
  {
    id: 'api-sandbox',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Interactive sandbox',
    icon: 'terminal',
    eyebrow: 'REST API v1 · Live runner',
    lead: 'Authenticate with your 3f_live_... workspace secret key and execute live GET, POST, and PATCH requests against your Neon Postgres ledger and Solana Devnet.',
    toc: [
      { id: 'sandbox-key-config', label: '1. Configure secret key' },
      { id: 'sandbox-executor', label: '2. Request builder & runner' },
    ],
  },
  {
    id: 'api-investors',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Investors & KYC API',
    icon: 'code',
    eyebrow: 'REST API v1 · Investors & KYC',
    lead: 'Onboard investors, submit KYC verification determinations via /api/v1/investors/:id/kyc, whitelist Solana wallets, and query settled Token-2022 holdings.',
    children: [
      { id: 'list-investors', label: '/api/v1/investors', method: 'GET' },
      { id: 'create-investor', label: '/api/v1/investors', method: 'POST' },
      {
        id: 'get-investor-kyc',
        label: '/investors/:id/kyc',
        method: 'GET',
      },
      {
        id: 'submit-investor-kyc',
        label: '/investors/:id/kyc',
        method: 'POST',
      },
      { id: 'get-investor', label: '/api/v1/investors/:id', method: 'GET' },
      { id: 'update-investor', label: '/api/v1/investors/:id', method: 'PATCH' },
    ],
    toc: [
      { id: 'list-investors', label: 'GET /api/v1/investors' },
      { id: 'create-investor', label: 'POST /api/v1/investors' },
      { id: 'get-investor-kyc', label: 'GET /investors/:investorId/kyc' },
      { id: 'submit-investor-kyc', label: 'POST /investors/:investorId/kyc' },
      { id: 'get-investor', label: 'GET /api/v1/investors/:investorId' },
      { id: 'update-investor', label: 'PATCH /api/v1/investors/:investorId' },
    ],
  },
  {
    id: 'api-assets',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Assets endpoints',
    icon: 'code',
    eyebrow: 'REST API v1 · Assets',
    lead: 'Catalog, list, and inspect underlying real-world collateral in your organization workspace.',
    children: [
      { id: 'list-assets', label: '/api/v1/assets', method: 'GET' },
      { id: 'create-asset', label: '/api/v1/assets', method: 'POST' },
      { id: 'get-asset', label: '/api/v1/assets/:id', method: 'GET' },
    ],
    toc: [
      { id: 'list-assets', label: 'GET /api/v1/assets' },
      { id: 'create-asset', label: 'POST /api/v1/assets' },
      { id: 'get-asset', label: 'GET /api/v1/assets/:assetId' },
    ],
  },
  {
    id: 'api-offerings',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Offerings & tokens',
    icon: 'code',
    eyebrow: 'REST API v1 · Offerings',
    lead: 'Configure offerings, transition lifecycle states, and trigger atomic Solana SPL Token-2022 mint deployment.',
    children: [
      { id: 'list-offerings', label: '/api/v1/offerings', method: 'GET' },
      { id: 'create-offering', label: '/api/v1/offerings', method: 'POST' },
      {
        id: 'update-offering-status',
        label: '/offerings/:id/status',
        method: 'POST',
      },
    ],
    toc: [
      { id: 'list-offerings', label: 'GET /api/v1/offerings' },
      { id: 'create-offering', label: 'POST /api/v1/offerings' },
      { id: 'update-offering-status', label: 'POST /offerings/:id/status' },
    ],
  },
  {
    id: 'api-subscriptions',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Subscriptions & settle',
    icon: 'code',
    eyebrow: 'REST API v1 · Subscriptions',
    lead: 'Record primary investor subscriptions and execute KYC-gated, idempotent Token-2022 ATA settlement on Solana Devnet.',
    children: [
      {
        id: 'create-subscription',
        label: '/offerings/:id/subscriptions',
        method: 'POST',
      },
      {
        id: 'settle-subscription',
        label: '/subscriptions/:id/settle',
        method: 'POST',
      },
    ],
    toc: [
      { id: 'create-subscription', label: 'POST /offerings/:id/subscriptions' },
      { id: 'settle-subscription', label: 'POST /subscriptions/:id/settle' },
    ],
  },
  {
    id: 'api-lifecycle',
    group: 'REST API v1',
    groupIndex: '3F/03',
    title: 'Holdings & distributions',
    icon: 'code',
    eyebrow: 'REST API v1 · Lifecycle',
    lead: 'Query the reconciled on-chain token holder cap table and execute pro-rata dividend or yield distributions.',
    children: [
      { id: 'get-holdings', label: '/offerings/:id/holdings', method: 'GET' },
      {
        id: 'create-distribution',
        label: '/offerings/:id/distributions',
        method: 'POST',
      },
    ],
    toc: [
      { id: 'get-holdings', label: 'GET /offerings/:id/holdings' },
      { id: 'create-distribution', label: 'POST /offerings/:id/distributions' },
    ],
  },
];

const GROUPS: { name: DocPageItem['group']; index: DocPageItem['groupIndex'] }[] = [
  { name: 'Getting started', index: '3F/01' },
  { name: 'Core mechanics', index: '3F/02' },
  { name: 'REST API v1', index: '3F/03' },
];

function NavIcon({
  name,
  className,
}: {
  name: DocPageItem['icon'];
  className?: string;
}) {
  const cls = className || 'size-4 shrink-0';
  switch (name) {
    case 'book':
      return <BookOpen className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    case 'building':
      return <Building2 className={cls} />;
    case 'layers':
      return <Layers className={cls} />;
    case 'coins':
      return <Coins className={cls} />;
    case 'key':
      return <KeyRound className={cls} />;
    case 'arrows':
      return <ArrowLeftRight className={cls} />;
    case 'pie':
      return <PieChart className={cls} />;
    case 'terminal':
      return <Terminal className={cls} />;
    case 'code':
    default:
      return <Code2 className={cls} />;
  }
}

export default function DocsPage() {
  const { authenticated, ready, login } = usePrivy();
  const [activePageId, setActivePageId] = useState<string>('platform-overview');
  const [activeTocId, setActiveTocId] = useState<string>('dual-ledger-model');

  const [selectedScope, setSelectedScope] = useState<'all' | 'guides' | 'api'>(
    'all'
  );
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [codeTab, setCodeTab] = useState<
    'curl' | 'typescript' | 'nextjs' | 'env'
  >('curl');
  const [sandboxKey, setSandboxKey] = useState('');
  const [maskKey, setMaskKey] = useState(false);
  const [copiedPage, setCopiedPage] = useState(false);

  const [sandboxEndpointId, setSandboxEndpointId] =
    useState<string>('submit-investor-kyc');
  const [sandboxPathParam, setSandboxPathParam] = useState<string>('1');
  const [sandboxBodyJson, setSandboxBodyJson] = useState<string>(
    JSON.stringify(
      ENDPOINTS.find((e) => e.id === 'submit-investor-kyc')?.sampleBody || {},
      null,
      2
    )
  );
  const [sandboxResult, setSandboxResult] = useState<{
    status: number;
    latencyMs: number;
    body: string;
    loading: boolean;
  } | null>(null);

  const currentPageIndex = DOC_PAGES.findIndex((p) => p.id === activePageId);
  const currentPage = DOC_PAGES[currentPageIndex] || DOC_PAGES[0];
  const prevPage =
    currentPageIndex > 0 ? DOC_PAGES[currentPageIndex - 1] : null;
  const nextPage =
    currentPageIndex < DOC_PAGES.length - 1
      ? DOC_PAGES[currentPageIndex + 1]
      : null;

  const effectiveKey =
    sandboxKey.trim() || '3f_live_9a8b7c6d5e4f3a2b1c0d9e8f';
  const displayedKey = maskKey
    ? `${effectiveKey.slice(0, 10)}••••••••••••••••••••`
    : effectiveKey;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('docs-search-box');
        if (el) el.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function navigateToPage(pageId: string, anchorId?: string) {
    setActivePageId(pageId);
    const target = DOC_PAGES.find((p) => p.id === pageId);
    if (anchorId) {
      setActiveTocId(anchorId);
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    } else if (target && target.toc.length > 0) {
      setActiveTocId(target.toc[0].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSelectSandboxEndpoint(epId: string) {
    setSandboxEndpointId(epId);
    const ep = ENDPOINTS.find((e) => e.id === epId);
    if (ep) {
      if (ep.defaultPathParam) setSandboxPathParam(ep.defaultPathParam);
      if (ep.sampleBody) {
        setSandboxBodyJson(JSON.stringify(ep.sampleBody, null, 2));
      } else {
        setSandboxBodyJson('{}');
      }
    }
    setSandboxResult(null);
  }

  function openEndpointInSandbox(ep: EndpointDoc) {
    handleSelectSandboxEndpoint(ep.id);
    navigateToPage('api-sandbox', 'sandbox-executor');
  }

  async function runSandboxRequest() {
    const ep =
      ENDPOINTS.find((e) => e.id === sandboxEndpointId) || ENDPOINTS[0];
    let resolvedPath = ep.path;
    if (ep.pathParamName) {
      resolvedPath = resolvedPath.replace(
        `:${ep.pathParamName}`,
        encodeURIComponent(sandboxPathParam.trim() || '1')
      );
    }

    setSandboxResult({ status: 0, latencyMs: 0, body: '', loading: true });
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: ep.method,
        headers: {
          Authorization: `Bearer ${sandboxKey.trim()}`,
          'Content-Type': 'application/json',
        },
      };
      if (ep.method === 'POST' || ep.method === 'PATCH') {
        options.body = sandboxBodyJson;
      }

      const res = await fetch(resolvedPath, options);
      const elapsed = Math.round(performance.now() - start);
      const data = await res.json();
      setSandboxResult({
        status: res.status,
        latencyMs: elapsed,
        body: JSON.stringify(data, null, 2),
        loading: false,
      });
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setSandboxResult({
        status: 500,
        latencyMs: elapsed,
        body: JSON.stringify({ error: err.message }, null, 2),
        loading: false,
      });
    }
  }

  function buildQuickstartCode() {
    if (codeTab === 'env') {
      return `# .env.local\nNEXT_PUBLIC_3RDFLOOR_API_URL="http://localhost:3000/api/v1"\nTHREEFLOOR_SECRET_KEY="${displayedKey}"`;
    }
    if (codeTab === 'typescript') {
      return `// 1. Onboard the investor profile\nconst onboardRes = await fetch("http://localhost:3000/api/v1/investors", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${displayedKey}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    name: "Apex Institutional Partners LP",\n    email: "treasury@apex-lp.io",\n    investorType: "institutional",\n    jurisdiction: "US",\n  }),\n});\nconst { data: investor } = await onboardRes.json();\n\n// 2. Approve KYC & whitelist their Solana wallet for Token-2022 settlement\nconst kycRes = await fetch(\`http://localhost:3000/api/v1/investors/\${investor.id}/kyc\`, {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${displayedKey}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    kycStatus: "approved",\n    investorType: "qualified_purchaser",\n    walletAddress: "GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX",\n    provider: "sumsub",\n    referenceId: "inq_98a7b6c5d4e3",\n  }),\n});\nconst { data: kyc } = await kycRes.json();\nconsole.log("Eligible for on-chain settlement:", kyc.eligibleForSettlement);`;
    }
    if (codeTab === 'nextjs') {
      return `// app/actions/compliance.ts\n'use server';\n\nexport async function approveInvestorKyc(investorId: number, walletAddress: string) {\n  const res = await fetch(\`http://localhost:3000/api/v1/investors/\${investorId}/kyc\`, {\n    method: "POST",\n    headers: {\n      Authorization: \`Bearer \${process.env.THREEFLOOR_SECRET_KEY}\`,\n      "Content-Type": "application/json",\n    },\n    body: JSON.stringify({\n      kycStatus: "approved",\n      walletAddress,\n      provider: "persona",\n    }),\n    cache: "no-store",\n  });\n  return res.json();\n}`;
    }
    return `# Approve investor KYC & whitelist their Solana wallet for Token-2022 ATA delivery\ncurl -X POST "http://localhost:3000/api/v1/investors/1/kyc" \\\n  -H "Authorization: Bearer ${displayedKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "kycStatus": "approved",\n    "investorType": "qualified_purchaser",\n    "jurisdiction": "US",\n    "walletAddress": "GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX",\n    "provider": "sumsub",\n    "referenceId": "inq_98a7b6c5d4e3"\n  }'`;
  }

  function buildEndpointSnippet(ep: EndpointDoc) {
    const url = `http://localhost:3000${ep.path}`;
    if (codeTab === 'typescript' || codeTab === 'nextjs') {
      if (ep.method === 'GET') {
        return `const response = await fetch("${url}", {\n  method: "GET",\n  headers: {\n    "Authorization": "Bearer ${displayedKey}",\n    "Content-Type": "application/json",\n  },\n});\n\nconst { data } = await response.json();`;
      }
      return `const response = await fetch("${url}", {\n  method: "${ep.method}",\n  headers: {\n    "Authorization": "Bearer ${displayedKey}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${JSON.stringify(
        ep.sampleBody || {},
        null,
        2
      )}),\n});\n\nconst { data } = await response.json();`;
    }
    if (ep.method === 'GET') {
      return `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${displayedKey}" \\\n  -H "Content-Type: application/json"`;
    }
    return `curl -X ${ep.method} "${url}" \\\n  -H "Authorization: Bearer ${displayedKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
      ep.sampleBody || {},
      null,
      2
    )}'`;
  }

  const inlineCode =
    'rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[#0A0A0A] px-1.5 py-0.5 font-mono text-[12.5px]';

  const selectedSandboxEp =
    ENDPOINTS.find((e) => e.id === sandboxEndpointId) || ENDPOINTS[0];

  const visibleGroups = GROUPS.filter((g) => {
    if (selectedScope === 'guides') return g.name !== 'REST API v1';
    if (selectedScope === 'api') return g.name === 'REST API v1';
    return true;
  });

  const searchMatches = searchQuery.trim()
    ? DOC_PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.lead.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-dvh flex flex-col bg-white text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white">
      {/* =====================================================================
          EDITORIAL WHITE & BLACK TOP BAR
          ===================================================================== */}
      <header className="sticky top-0 z-30 h-16 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-full px-6 sm:px-10 flex items-center justify-between gap-4">
          {/* Left: Brand + Section Links */}
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[18px] font-medium tracking-[-0.025em] text-[#0A0A0A]"
              >
                3rdfloor
              </Link>
              <span className="text-[#D4D4D8] text-sm">/</span>
              <span className="text-[13.5px] text-[#525252]">
                Documentation
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-[13.5px]">
              <button
                type="button"
                onClick={() => navigateToPage('platform-overview')}
                className={`transition-colors cursor-pointer ${
                  !activePageId.startsWith('api-')
                    ? 'text-[#0A0A0A] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
                }`}
              >
                Guides
              </button>
              <button
                type="button"
                onClick={() => navigateToPage('api-investors')}
                className={`transition-colors cursor-pointer ${
                  activePageId.startsWith('api-') &&
                  activePageId !== 'api-sandbox'
                    ? 'text-[#0A0A0A] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
                }`}
              >
                API reference
              </button>
              <button
                type="button"
                onClick={() => navigateToPage('api-sandbox')}
                className={`flex items-center gap-2 transition-colors cursor-pointer ${
                  activePageId === 'api-sandbox'
                    ? 'text-[#0A0A0A] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
                }`}
              >
                <span className="size-1.5 rounded-full bg-[#0A0A0A]" />
                <span>Sandbox</span>
              </button>
              <Link
                href="/explore"
                className="text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
              >
                Marketplace
              </Link>
            </nav>
          </div>

          {/* Right: Search + OpenAPI + Workspace Action */}
          <div className="flex items-center gap-3.5">
            <div className="relative hidden sm:block w-64">
              <Search className="size-3.5 text-[#737373] absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                id="docs-search-box"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides & endpoints..."
                className="w-full h-9 pl-9 pr-14 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[13px] text-[#0A0A0A] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
              <kbd className="absolute right-3 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white text-[#737373] border border-[#E5E5E5] pointer-events-none">
                Ctrl K
              </kbd>

              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[#E5E5E5] bg-white shadow-xl py-1.5 z-30 overflow-hidden">
                  {searchMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        navigateToPage(m.id);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                    >
                      <div className="text-[13px] font-medium text-[#0A0A0A]">
                        {m.title}
                      </div>
                      <div className="text-[11px] text-[#737373] mt-0.5">
                        {m.group}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[12.5px] font-mono text-[#0A0A0A] transition-colors"
            >
              <span>openapi.json</span>
              <ExternalLink className="size-3 text-[#737373]" />
            </a>

            {ready && authenticated ? (
              <Link
                href="/dashboard"
                className="h-9 px-5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[13px] font-normal flex items-center justify-center transition-colors"
              >
                Workspace &rarr;
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => login()}
                disabled={!ready}
                className="h-9 px-5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[13px] font-normal flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
              >
                Start a project
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          3-COLUMN EDITORIAL DOCUMENTATION GRID
          ===================================================================== */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col md:flex-row">
        {/* Column 1: Left Sidebar */}
        <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-[#E5E5E5] md:sticky md:top-16 md:h-[calc(100dvh-4rem)] flex flex-col p-6 bg-white">
          {/* Scope Filter Dropdown */}
          <div className="relative mb-7">
            <button
              type="button"
              onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F3F3F3] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-[#737373]">Section</div>
                <div className="text-[13px] font-medium text-[#0A0A0A] truncate mt-0.5">
                  {selectedScope === 'all'
                    ? 'All guides & API reference'
                    : selectedScope === 'guides'
                    ? 'Onboarding & core guides'
                    : 'REST API v1 & sandbox'}
                </div>
              </div>
              <ChevronDown className="size-4 text-[#737373] shrink-0" />
            </button>

            {scopeDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#E5E5E5] bg-white p-1.5 shadow-xl z-20">
                {[
                  { id: 'all', label: 'All guides & API reference' },
                  { id: 'guides', label: 'Onboarding & core guides' },
                  { id: 'api', label: 'REST API v1 & sandbox' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedScope(opt.id as any);
                      setScopeDropdownOpen(false);
                      if (
                        opt.id === 'api' &&
                        !activePageId.startsWith('api-')
                      ) {
                        navigateToPage('api-sandbox');
                      } else if (
                        opt.id === 'guides' &&
                        activePageId.startsWith('api-')
                      ) {
                        navigateToPage('platform-overview');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                      selectedScope === opt.id
                        ? 'bg-[#0A0A0A] text-white font-medium'
                        : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Navigation Tree */}
          <nav className="flex-1 overflow-y-auto pr-1 space-y-7">
            {visibleGroups.map((grp) => {
              const items = DOC_PAGES.filter((p) => p.group === grp.name);
              return (
                <div key={grp.name}>
                  <div className="flex items-center justify-between mb-2.5 px-2.5">
                    <span className="text-[12px] font-medium text-[#0A0A0A] flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-[#0A0A0A]" />
                      {grp.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#8E8E93] tabular-nums">
                      {grp.index}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const active = activePageId === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => navigateToPage(item.id)}
                            className={`w-full text-left h-9 px-3 rounded-lg text-[13.5px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#0A0A0A] text-white font-medium'
                                : 'text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <NavIcon
                                name={item.icon}
                                className={`size-3.5 shrink-0 ${
                                  active ? 'text-white' : 'text-[#737373]'
                                }`}
                              />
                              <span className="truncate">{item.title}</span>
                            </span>

                            {item.children && (
                              <ChevronRight
                                className={`size-3.5 shrink-0 transition-transform ${
                                  active
                                    ? 'rotate-90 text-white/80'
                                    : 'text-[#8E8E93]'
                                }`}
                              />
                            )}
                          </button>

                          {/* Nested Endpoint Links */}
                          {active && item.children && (
                            <ul className="mt-1.5 ml-4 pl-3 border-l border-[#E5E5E5] space-y-1 py-1">
                              {item.children.map((child) => (
                                <li key={child.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigateToPage(item.id, child.id)
                                    }
                                    className="w-full text-left py-1.5 px-2 rounded-md text-[12px] font-mono text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <span className="truncate">
                                      {child.label}
                                    </span>
                                    {child.method && (
                                      <span className="text-[10px] font-semibold text-[#0A0A0A]">
                                        {child.method}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Column 2: Center Editorial & Interactive Content */}
        <main className="flex-1 min-w-0 py-12 px-6 sm:px-12 lg:px-16 max-w-3xl">
          {/* Page Header */}
          <div className="border-b border-[#E5E5E5] pb-8 mb-12">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#525252]">
                <span className="size-2 rounded-full bg-[#0A0A0A]" />
                <span>{currentPage.eyebrow}</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `# ${currentPage.title}\n\n${currentPage.lead}`
                  );
                  setCopiedPage(true);
                  setTimeout(() => setCopiedPage(false), 2000);
                }}
                className="h-8 px-3 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedPage ? (
                  <>
                    <Check className="size-3.5 text-[#0A0A0A]" />
                    <span className="text-[#0A0A0A] font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy page</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.025em] leading-[1.15] text-[#0A0A0A] text-balance">
              {currentPage.title}
            </h1>
            <p className="text-[16px] text-[#525252] mt-4 leading-[1.75] text-pretty">
              {currentPage.lead}
            </p>
          </div>

          {/* =================================================================
              PAGE 1: ARCHITECTURE & QUICKSTART
              ================================================================= */}
          {activePageId === 'platform-overview' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section
                id="dual-ledger-model"
                className="scroll-mt-24 space-y-5"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  The dual-ledger architecture
                </h2>
                <p className="text-[#404040] text-pretty">
                  Tokenizing a real-world asset (RWA)—such as a Class-A
                  commercial building, a private credit facility, or an insured
                  fine art collection—requires coordinating two worlds that
                  traditionally do not speak to one another:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                    <div className="font-mono text-[11.5px] uppercase tracking-wider text-[#737373]">
                      Layer 01 · Off-chain compliance ledger
                    </div>
                    <div className="text-[15.5px] font-medium text-[#0A0A0A]">
                      SPV legal structure &amp; KYC registry
                    </div>
                    <p className="text-[13.5px] text-[#525252] leading-[1.65]">
                      Maintains corporate KYB verification, appraised Net Asset
                      Value (NAV), investor identity &amp; accreditation
                      dossiers (<code className={inlineCode}>/kyc</code>), and
                      fiat/wire subscription commitments in an isolated Postgres
                      ledger.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                    <div className="font-mono text-[11.5px] uppercase tracking-wider text-[#737373]">
                      Layer 02 · On-chain settlement layer
                    </div>
                    <div className="text-[15.5px] font-medium text-[#0A0A0A]">
                      Solana SPL Token-2022 program
                    </div>
                    <p className="text-[13.5px] text-[#525252] leading-[1.65]">
                      Initializes Token-2022 mints with embedded{' '}
                      <code className={inlineCode}>MetadataPointer</code>{' '}
                      extensions, provisions investor Associated Token Accounts
                      (ATAs), and records cryptographic proof of ownership.
                    </p>
                  </div>
                </div>
                <p className="text-[#404040] text-pretty">
                  3rdfloor unifies both layers behind a single workspace
                  dashboard and our programmable{' '}
                  <code className={inlineCode}>/api/v1/*</code> REST API. Every
                  on-chain token transfer is gated by off-chain compliance
                  state, ensuring that SPL Token-2022 allocations can only
                  settle into wallets owned by KYC-approved investors.
                </p>
              </section>

              <section
                id="lifecycle-roadmap"
                className="scroll-mt-24 space-y-5"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  The 5-stage issuance pipeline
                </h2>
                <p className="text-[#404040] text-pretty">
                  Whether you operate through the hosted issuer dashboard or
                  automate issuance headlessly from your backend, every project
                  follows a deterministic five-stage lifecycle:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    {
                      step: '01',
                      title: 'Provision organization & KYB',
                      desc: 'Create your isolated SPV workspace on /dashboard and submit corporate formation documents for KYB clearance.',
                      target: 'organizations-kyb',
                    },
                    {
                      step: '02',
                      title: 'Catalog underlying collateral',
                      desc: 'Register the real-world asset, its custody arrangement, and appraised NAV via UI or POST /api/v1/assets.',
                      target: 'asset-registration',
                    },
                    {
                      step: '03',
                      title: 'Structure offering & deploy mint',
                      desc: 'Define token supply, price, and target raise, then atomically initialize the Solana Token-2022 mint.',
                      target: 'offerings-tokenomics',
                    },
                    {
                      step: '04',
                      title: 'Verify investor KYC & whitelist',
                      desc: 'Onboard investors and call POST /api/v1/investors/:id/kyc to attest accreditation and whitelist their Solana wallet.',
                      target: 'investors-kyc',
                    },
                  ].map((card) => (
                    <button
                      key={card.step}
                      type="button"
                      onClick={() => navigateToPage(card.target)}
                      className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F3F3F3] hover:border-[#0A0A0A]/30 text-left transition-all group cursor-pointer"
                    >
                      <div className="font-mono text-[12px] text-[#737373] mb-1.5">
                        Stage {card.step}
                      </div>
                      <div className="text-[15.5px] font-medium text-[#0A0A0A]">
                        {card.title} &rarr;
                      </div>
                      <p className="text-[13.5px] text-[#525252] mt-1.5 leading-[1.6] text-pretty">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-mono text-[12px] text-[#737373]">
                      Stage 05 · Primary settlement &amp; yield lifecycle
                    </div>
                    <div className="text-[15.5px] font-medium text-[#0A0A0A]">
                      Settle investor ATAs &amp; distribute pro-rata cash yields
                    </div>
                    <p className="text-[13.5px] text-[#525252] leading-[1.6]">
                      Once an investor&apos;s KYC is approved and subscription
                      funds clear, call{' '}
                      <code className={inlineCode}>
                        POST /api/v1/subscriptions/:id/settle
                      </code>{' '}
                      to deliver Token-2022 units and run automated dividend
                      distributions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToPage('subscriptions-settlement')}
                    className="h-9 px-4 rounded-full bg-[#0A0A0A] text-white text-[13px] shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    Explore settlement &rarr;
                  </button>
                </div>
              </section>

              <section id="quick-env-setup" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Quickstart: environment &amp; first KYC API call
                </h2>
                <p className="text-[#404040] text-pretty">
                  Generate a workspace secret key (<code className={inlineCode}>3f_live_...</code>)
                  under <code className={inlineCode}>/org/[id]/developers</code>,
                  then use any of the snippets below to onboard an institutional
                  investor and approve their KYC &amp; Solana wallet whitelist:
                </p>

                <CodeBlock
                  tabs={[
                    { id: 'curl', label: 'cURL' },
                    { id: 'typescript', label: 'TypeScript' },
                    { id: 'nextjs', label: 'Next.js' },
                    { id: 'env', label: '.env.local' },
                  ]}
                  activeTab={codeTab}
                  onTabChange={(id) => setCodeTab(id as any)}
                  title={
                    codeTab === 'curl'
                      ? 'Terminal'
                      : codeTab === 'env'
                      ? '.env.local'
                      : 'POST /api/v1/investors/:id/kyc'
                  }
                  language={
                    codeTab === 'curl' || codeTab === 'env'
                      ? 'bash'
                      : 'typescript'
                  }
                  code={buildQuickstartCode()}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section
                id="api-conventions"
                className="scroll-mt-24 space-y-5"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  API conventions, response envelope &amp; status codes
                </h2>
                <p className="text-[#404040] text-pretty">
                  All REST API v1 endpoints are served under{' '}
                  <code className={inlineCode}>/api/v1/*</code>, accept and
                  return <code className={inlineCode}>application/json</code>,
                  and wrap payloads in a deterministic envelope:
                </p>
                <ul className="list-disc pl-5 space-y-2.5 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Success envelope:
                    </strong>{' '}
                    Returns <code className={inlineCode}>{`{ "data": ..., "meta": { "timestamp": "..." } }`}</code>.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Error envelope:
                    </strong>{' '}
                    Returns <code className={inlineCode}>{`{ "error": { "code": "...", "message": "...", "status": 422 } }`}</code>{' '}
                    with machine-readable error codes for deterministic
                    exception handling.
                  </li>
                </ul>

                <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13.5px] tabular-nums">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                        <th className="py-3.5 px-5">HTTP Status</th>
                        <th className="py-3.5 px-5">Error Code</th>
                        <th className="py-3.5 px-5">Meaning &amp; resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          200 / 201
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#737373]">
                          OK / CREATED
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Request succeeded; resource created, updated, or
                          settled on Solana Devnet.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          401
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A]">
                          INVALID_API_KEY
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Missing, malformed, or revoked{' '}
                          <code className={inlineCode}>3f_live_...</code> secret
                          key.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          403
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A]">
                          KYC_NOT_APPROVED
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Investor KYC status is{' '}
                          <code className={inlineCode}>rejected</code> or{' '}
                          <code className={inlineCode}>suspended</code>; approve
                          via <code className={inlineCode}>/investors/:id/kyc</code>{' '}
                          before settling tokens.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          409
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A]">
                          OFFERING_CLOSED
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Offering is paused or closed and cannot accept new
                          subscriptions.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          422
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A]">
                          EXCEEDS_AVAILABLE_SUPPLY
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Requested token allocation exceeds the remaining
                          unallocated treasury supply.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 2: 1. ORGANIZATIONS & CORPORATE KYB
              ================================================================= */}
          {activePageId === 'organizations-kyb' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section id="why-workspaces" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Why issuer workspaces exist
                </h2>
                <p className="text-[#404040] text-pretty">
                  In institutional capital markets, real-world assets are rarely
                  held directly by a software company. Instead, each property,
                  credit fund, or infrastructure project is ring-fenced inside a
                  dedicated legal entity—typically a Delaware Series LLC, a
                  Cayman Islands Exempted Limited Partnership, or a Luxembourg
                  Securitization Vehicle (SV).
                </p>
                <p className="text-[#404040] text-pretty">
                  3rdfloor models this legal boundary directly through{' '}
                  <strong className="text-[#0A0A0A] font-medium">
                    Organizations
                  </strong>
                  . Every asset, offering, SPL Token-2022 mint, investor KYC
                  record, and API key is strictly owned by a single Organization
                  workspace. A single user account can belong to multiple
                  organizations with distinct governance roles (
                  <code className={inlineCode}>owner</code>,{' '}
                  <code className={inlineCode}>admin</code>,{' '}
                  <code className={inlineCode}>compliance</code>).
                </p>
              </section>

              <section id="creating-org" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Provisioning a workspace &amp; completing KYB
                </h2>
                <p className="text-[#404040] text-pretty">
                  Before your workspace can deploy live SPL Token-2022 contracts
                  or open primary offerings to investors, the underlying corporate
                  entity must complete Know Your Business (KYB) verification:
                </p>
                <ol className="list-decimal pl-5 space-y-3.5 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Authenticate your operator identity:
                    </strong>{' '}
                    Click <strong className="text-[#0A0A0A] font-medium">Start a project</strong>{' '}
                    in the top navigation bar to sign in via Privy using your
                    corporate email, Google workspace account, or hardware
                    Solana wallet.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Initialize the organization:
                    </strong>{' '}
                    From <code className={inlineCode}>/dashboard</code>, create
                    a new organization workspace by supplying your commercial
                    operating name, registered SPV legal name, corporate
                    registration/EIN number, and formation jurisdiction.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Submit KYB attestation:
                    </strong>{' '}
                    Inside <code className={inlineCode}>/org/[id]</code>, submit
                    your corporate verification dossier. In development and
                    sandbox environments, you can trigger instant KYB approval
                    directly from the workspace banner to test the full Solana
                    Token-2022 lifecycle end to end.
                  </li>
                </ol>
              </section>

              <section id="kyb-matrix" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  KYB compliance gate matrix
                </h2>
                <p className="text-[#404040] text-pretty">
                  3rdfloor enforces non-bypassable state checks based on your
                  organization&apos;s <code className={inlineCode}>kybStatus</code>.
                  We intentionally allow engineering teams to build and test
                  integrations while legal review is still <code className={inlineCode}>pending</code>,
                  while blocking public capital formation until approval:
                </p>
                <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13.5px] tabular-nums">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                        <th className="py-3.5 px-5">KYB Status</th>
                        <th className="py-3.5 px-5">Permitted operations</th>
                        <th className="py-3.5 px-5">Restricted operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      <tr>
                        <td className="py-4 px-5 font-mono text-[#0A0A0A] font-medium">
                          pending
                        </td>
                        <td className="py-4 px-5 text-[#404040] leading-[1.6]">
                          Catalog draft assets, structure draft offerings,
                          onboard investors, test{' '}
                          <code className={inlineCode}>/investors/:id/kyc</code>,
                          and issue <code className={inlineCode}>3f_live_...</code>{' '}
                          API keys.
                        </td>
                        <td className="py-4 px-5 text-[#525252] leading-[1.6]">
                          Cannot transition offerings to{' '}
                          <code className={inlineCode}>open</code> or deploy live
                          Token-2022 mints.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-mono text-[#0A0A0A] font-medium">
                          approved
                        </td>
                        <td className="py-4 px-5 text-[#404040] leading-[1.6]">
                          Full production clearance: deploy Solana SPL
                          Token-2022 mints, publish offerings to{' '}
                          <code className={inlineCode}>/explore</code>, settle
                          investor ATAs, and execute yield distributions.
                        </td>
                        <td className="py-4 px-5 text-[#525252] leading-[1.6]">
                          None.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-mono text-[#737373]">
                          rejected
                        </td>
                        <td className="py-4 px-5 text-[#404040] leading-[1.6]">
                          Read-only access to existing workspace records and
                          compliance notes.
                        </td>
                        <td className="py-4 px-5 text-[#525252] leading-[1.6]">
                          All minting, offering activation, and primary
                          subscription settlements are halted.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                id="workspace-isolation"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Multi-tenant isolation model
                </h2>
                <p className="text-[#404040] text-pretty">
                  Every API key generated in{' '}
                  <code className={inlineCode}>/org/[id]/developers</code> is
                  cryptographically bound to that organization&apos;s{' '}
                  <code className={inlineCode}>organizationId</code>. When you
                  call any <code className={inlineCode}>/api/v1/*</code>{' '}
                  endpoint, the authentication middleware resolves your
                  workspace context from the SHA-256 key digest—you never pass{' '}
                  <code className={inlineCode}>organizationId</code> in URL
                  paths or request bodies, eliminating cross-tenant ID
                  enumeration vulnerabilities.
                </p>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 3: 2. REGISTERING REAL-WORLD ASSETS
              ================================================================= */}
          {activePageId === 'asset-registration' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section
                id="asset-offering-separation"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Why assets and offerings are separated (1:N model)
                </h2>
                <p className="text-[#404040] text-pretty">
                  A common architectural mistake in early tokenization platforms
                  is conflating the{' '}
                  <strong className="text-[#0A0A0A] font-medium">
                    Underlying Asset
                  </strong>{' '}
                  with the{' '}
                  <strong className="text-[#0A0A0A] font-medium">
                    Financial Offering
                  </strong>
                  . In institutional finance, a single commercial property or
                  credit portfolio (the Asset) frequently backs multiple
                  capital tranches over its lifecycle—for example, a{' '}
                  <em>Series A Senior Secured Note</em> followed by a{' '}
                  <em>Series B Preferred Equity</em> tranche.
                </p>
                <p className="text-[#404040] text-pretty">
                  In 3rdfloor, you register the physical or financial collateral
                  once as an <code className={inlineCode}>Asset</code> record,
                  establishing its appraised Net Asset Value (NAV), currency,
                  and legal description. You can then structure one or many{' '}
                  <code className={inlineCode}>Offerings</code> against that
                  <code className={inlineCode}>assetId</code>.
                </p>
              </section>

              <section
                id="register-asset-call"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Registering an underlying asset via API
                </h2>
                <p className="text-[#404040] text-pretty">
                  You can register collateral interactively at{' '}
                  <code className={inlineCode}>/org/[id]/assets/new</code> or
                  programmatically via{' '}
                  <code className={inlineCode}>POST /api/v1/assets</code>. The{' '}
                  <code className={inlineCode}>declaredValuation</code> is
                  stored as an exact arbitrary-precision decimal in Postgres to
                  prevent floating-point rounding drift during NAV calculations:
                </p>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`curl -X POST "http://localhost:3000/api/v1/assets" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Mayfair Commercial Plaza",
    "category": "Real Estate",
    "declaredValuation": 4500000,
    "currency": "USD",
    "description": "Class-A commercial office complex held in a bankruptcy-remote Delaware Series LLC."
  }'`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section id="asset-classes" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Supported institutional asset classes
                </h2>
                <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                        <th className="py-3.5 px-5">Category</th>
                        <th className="py-3.5 px-5">Typical legal wrapper</th>
                        <th className="py-3.5 px-5">Primary yield source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      <tr>
                        <td className="py-4 px-5 font-medium text-[#0A0A0A]">
                          Real Estate
                        </td>
                        <td className="py-4 px-5 text-[#404040]">
                          Single-asset SPV LLC / REIT subsidiary
                        </td>
                        <td className="py-4 px-5 text-[#525252]">
                          Commercial lease cashflows &amp; property appreciation
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-medium text-[#0A0A0A]">
                          Private Credit
                        </td>
                        <td className="py-4 px-5 text-[#404040]">
                          Master-feeder credit fund / Securitization trust
                        </td>
                        <td className="py-4 px-5 text-[#525252]">
                          Monthly or quarterly senior secured loan interest
                          coupons
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-medium text-[#0A0A0A]">
                          Infrastructure
                        </td>
                        <td className="py-4 px-5 text-[#404040]">
                          Project finance SPV (Solar, Grid, Data Centers)
                        </td>
                        <td className="py-4 px-5 text-[#525252]">
                          Power Purchase Agreement (PPA) &amp; capacity revenues
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-medium text-[#0A0A0A]">
                          Fine Art
                        </td>
                        <td className="py-4 px-5 text-[#404040]">
                          Freeport custodial bailment trust
                        </td>
                        <td className="py-4 px-5 text-[#525252]">
                          Exhibition licensing &amp; secondary liquidation
                          proceeds
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 4: 3. OFFERINGS & TOKEN-2022 DEPLOYMENT
              ================================================================= */}
          {activePageId === 'offerings-tokenomics' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section
                id="two-step-offering"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Structuring offering tokenomics
                </h2>
                <p className="text-[#404040] text-pretty">
                  An <strong className="text-[#0A0A0A] font-medium">Offering</strong>{' '}
                  defines the commercial and cryptographic rules under which
                  investors acquire fractionalized interests in an{' '}
                  <code className={inlineCode}>assetId</code>. When creating an
                  offering via <code className={inlineCode}>POST /api/v1/offerings</code>,
                  you configure two linked parameter sets:
                </p>
                <ol className="list-decimal pl-5 space-y-3 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Subscription economics:
                    </strong>{' '}
                    Define <code className={inlineCode}>targetRaise</code> (total
                    USD capital sought),{' '}
                    <code className={inlineCode}>minInvestment</code>,{' '}
                    <code className={inlineCode}>maxInvestment</code>, and the
                    offering memorandum.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      SPL Token-2022 parameters:
                    </strong>{' '}
                    Define the on-chain{' '}
                    <code className={inlineCode}>tokenName</code>,{' '}
                    <code className={inlineCode}>tokenSymbol</code> (ticker),{' '}
                    <code className={inlineCode}>tokenSupply</code> (total units
                    minted into treasury), and{' '}
                    <code className={inlineCode}>tokenPrice</code> (USD price
                    per unit).
                  </li>
                </ol>
                <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] font-mono text-[13px] text-[#0A0A0A]">
                  Invariant: Target Raise ($4,500,000) = Token Supply (450,000 MFR) &times; Token Price ($10.00)
                </div>
              </section>

              <section id="why-token-2022" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Why 3rdfloor uses Solana SPL Token-2022
                </h2>
                <p className="text-[#404040] text-pretty">
                  Unlike legacy SPL tokens that require external third-party
                  metadata programs, 3rdfloor deploys every offering on Solana&apos;s{' '}
                  <strong className="text-[#0A0A0A] font-medium">
                    Token-2022 (Token Extensions)
                  </strong>{' '}
                  program (<code className={inlineCode}>TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code>).
                </p>
                <p className="text-[#404040] text-pretty">
                  Each mint is initialized with the native{' '}
                  <code className={inlineCode}>MetadataPointer</code> extension,
                  embedding the token&apos;s name, ticker symbol, and offering
                  URI directly inside the mint account&apos;s Type-Length-Value
                  (TLV) buffer. This guarantees that institutional custodians,
                  indexers, and Solana Explorer can inspect the asset&apos;s
                  provenance directly from the mint account with zero external
                  account dependencies.
                </p>
              </section>

              <section id="token-2022-mint" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Atomic Solana Token-2022 initialization
                </h2>
                <p className="text-[#404040] text-pretty">
                  When an approved organization transitions an offering to{' '}
                  <code className={inlineCode}>open</code> with{' '}
                  <code className={inlineCode}>deployToken: true</code>,
                  3rdfloor executes an atomic Solana Devnet transaction that:
                </p>
                <ol className="list-decimal pl-5 space-y-2.5 text-[#333333]">
                  <li>
                    Allocates the exact rent-exempt byte length for both the
                    Token-2022 Mint header and the variable-length{' '}
                    <code className={inlineCode}>TokenMetadata</code> payload.
                  </li>
                  <li>
                    Initializes the <code className={inlineCode}>MetadataPointer</code>{' '}
                    and <code className={inlineCode}>Mint</code> instructions in
                    a single atomic transaction.
                  </li>
                  <li>
                    Provisions the issuer treasury&apos;s Associated Token
                    Account (ATA) and mints 100% of the initial{' '}
                    <code className={inlineCode}>tokenSupply</code> into
                    treasury custody.
                  </li>
                </ol>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`curl -X POST "http://localhost:3000/api/v1/offerings/1/status" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "open",
    "deployToken": true
  }'`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section
                id="offering-lifecycle"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Offering lifecycle state machine
                </h2>
                <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                        <th className="py-3.5 px-5">State</th>
                        <th className="py-3.5 px-5">On-chain &amp; API behavior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          draft
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Initial configuration state; editable terms, hidden
                          from <code className={inlineCode}>/explore</code>.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          under_review / approved
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Internal compliance sign-off completed; ready for
                          Token-2022 mint initialization.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          open
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Token-2022 mint is live on Solana; accepts primary
                          investor subscriptions via UI and API.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#737373]">
                          paused / closed
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Primary subscriptions halted (<code className={inlineCode}>409 OFFERING_CLOSED</code>);
                          post-issuance cap table queries and yield
                          distributions remain active.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 5: API KEYS & CRYPTOGRAPHIC SECURITY
              ================================================================= */}
          {activePageId === 'authentication-keys' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section id="generating-keys" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Issuing workspace secret keys
                </h2>
                <p className="text-[#404040] text-pretty">
                  Every programmatic request to <code className={inlineCode}>/api/v1/*</code>{' '}
                  is authenticated using a workspace-scoped secret key prefixed
                  with <code className={inlineCode}>3f_live_</code>. To generate
                  a credential:
                </p>
                <ol className="list-decimal pl-5 space-y-2.5 text-[#333333]">
                  <li>
                    Open your organization workspace and navigate to{' '}
                    <code className={inlineCode}>/org/[id]/developers</code>.
                  </li>
                  <li>
                    Click <strong className="text-[#0A0A0A] font-medium">+ Add new key</strong>{' '}
                    and assign a descriptive label (e.g.,{' '}
                    <em>Sumsub KYC Webhook Worker</em> or{' '}
                    <em>Treasury Settlement Service</em>).
                  </li>
                  <li>
                    Copy the raw secret immediately and store it in your backend
                    secret manager or <code className={inlineCode}>.env.local</code>:
                  </li>
                </ol>

                <CodeBlock
                  title=".env.local"
                  language="bash"
                  code={`NEXT_PUBLIC_3RDFLOOR_API_URL="http://localhost:3000/api/v1"\nTHREEFLOOR_SECRET_KEY="${displayedKey}"`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section id="auth-headers" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Authentication headers
                </h2>
                <p className="text-[#404040] text-pretty">
                  You may supply your secret key using either the standard HTTP{' '}
                  <code className={inlineCode}>Authorization: Bearer</code>{' '}
                  scheme or the <code className={inlineCode}>x-api-key</code>{' '}
                  header:
                </p>
                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`# Option 1: RFC 6750 Bearer Token (Recommended)
Authorization: Bearer ${displayedKey}

# Option 2: X-API-Key Header
x-api-key: ${displayedKey}`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section id="sha256-storage" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Zero-plaintext SHA-256 storage architecture
                </h2>
                <p className="text-[#404040] text-pretty">
                  3rdfloor never persists raw API keys in Postgres. When a key
                  is generated, the server computes a one-way{' '}
                  <code className={inlineCode}>SHA-256</code> digest (
                  <code className={inlineCode}>keyHash</code>) and stores only
                  the digest alongside a non-sensitive 12-character display
                  prefix (<code className={inlineCode}>3f_live_9a8b...</code>).
                </p>
                <p className="text-[#404040] text-pretty">
                  On every incoming API call, the authentication middleware
                  hashes the presented token in memory, performs an indexed
                  lookup against <code className={inlineCode}>api_keys.key_hash</code>,
                  verifies that <code className={inlineCode}>revoked_at IS NULL</code>,
                  and updates the key&apos;s <code className={inlineCode}>last_used_at</code>{' '}
                  telemetry timestamp.
                </p>
              </section>

              <section id="key-rotation" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Key rotation &amp; operational security
                </h2>
                <p className="text-[#404040] text-pretty">
                  Because workspace secret keys carry authority to approve
                  investor KYC and settle SPL Token-2022 allocations on Solana,
                  they must only be used from server-side environments (Next.js
                  Server Actions, Route Handlers, or backend workers)—never
                  bundled into browser client code. To rotate a key with zero
                  downtime, issue a secondary key in{' '}
                  <code className={inlineCode}>/org/[id]/developers</code>,
                  redeploy your environment variables, and click{' '}
                  <strong className="text-[#0A0A0A] font-medium">Revoke</strong>{' '}
                  on the retired key.
                </p>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 6: INVESTOR KYC, ACCREDITATION & WALLET WHITELISTING
              ================================================================= */}
          {activePageId === 'investors-kyc' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section
                id="kyc-architecture"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  How investor KYC gates on-chain settlement
                </h2>
                <p className="text-[#404040] text-pretty">
                  Regulated real-world asset tokens cannot be distributed to
                  unverified, anonymous wallet addresses. Whether an offering is
                  structured under SEC Regulation D (Rule 506(c)), Regulation S,
                  or institutional private placement exemptions, the issuer must
                  verify four compliance pillars before delivering SPL
                  Token-2022 units:
                </p>
                <ol className="list-decimal pl-5 space-y-2.5 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Identity verification (KYC/KYB):
                    </strong>{' '}
                    Government ID or corporate beneficial ownership (UBO)
                    verification.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Accreditation attestation:
                    </strong>{' '}
                    Verifying that the subscriber meets the financial thresholds
                    for <code className={inlineCode}>accredited</code>,{' '}
                    <code className={inlineCode}>institutional</code>, or{' '}
                    <code className={inlineCode}>qualified_purchaser</code>{' '}
                    status.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Sanctions &amp; jurisdiction screening:
                    </strong>{' '}
                    Confirming the investor&apos;s ISO tax domicile (e.g.,{' '}
                    <code className={inlineCode}>US</code>,{' '}
                    <code className={inlineCode}>UK</code>,{' '}
                    <code className={inlineCode}>CH</code>,{' '}
                    <code className={inlineCode}>SG</code>) passes OFAC/AML
                    screening.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Solana wallet binding:
                    </strong>{' '}
                    Associating the verified legal identity with a specific
                    Base58 Solana wallet address where their Associated Token
                    Account (ATA) will be provisioned.
                  </li>
                </ol>
              </section>

              <section
                id="onboarding-investors"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Step 1: Onboarding an investor profile
                </h2>
                <p className="text-[#404040] text-pretty">
                  When a prospective investor registers on your portal, create
                  their initial record in your workspace&apos;s Investor
                  Registry with <code className={inlineCode}>POST /api/v1/investors</code>{' '}
                  (typically starting in <code className={inlineCode}>kycStatus: &quot;pending&quot;</code>):
                </p>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`curl -X POST "http://localhost:3000/api/v1/investors" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Apex Institutional Partners LP",
    "email": "treasury@apex-lp.io",
    "investorType": "institutional",
    "jurisdiction": "US",
    "kycStatus": "pending"
  }'`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section
                id="verifying-kyc-endpoint"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Step 2: Calling the dedicated <code className="font-mono text-[19px]">/kyc</code> verification endpoint
                </h2>
                <p className="text-[#404040] text-pretty">
                  Once your compliance team or external KYC provider (Sumsub,
                  Persona, Parallel Markets) completes verification, submit the
                  determination to{' '}
                  <code className={inlineCode}>
                    POST /api/v1/investors/:investorId/kyc
                  </code>
                  . This endpoint updates the investor&apos;s KYC status,
                  attests their accreditation tier, binds their Solana wallet
                  address, and returns a computed{' '}
                  <code className={inlineCode}>eligibleForSettlement</code>{' '}
                  boolean alongside granular compliance checks:
                </p>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`curl -X POST "http://localhost:3000/api/v1/investors/1/kyc" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kycStatus": "approved",
    "investorType": "qualified_purchaser",
    "jurisdiction": "US",
    "walletAddress": "GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX",
    "provider": "sumsub",
    "referenceId": "inq_98a7b6c5d4e3",
    "notes": "Rule 506(c) CPA letter verified; OFAC check passed."
  }'`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />

                <p className="text-[#404040] text-pretty">
                  You can also query{' '}
                  <code className={inlineCode}>
                    GET /api/v1/investors/:investorId/kyc
                  </code>{' '}
                  at any time before initiating a wire or token settlement to
                  verify that <code className={inlineCode}>eligibleForSettlement: true</code>.
                </p>
              </section>

              <section
                id="kyc-classifications"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Accreditation tiers &amp; KYC states
                </h2>
                <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                        <th className="py-3.5 px-5">KYC Status</th>
                        <th className="py-3.5 px-5">eligibleForSettlement</th>
                        <th className="py-3.5 px-5">On-chain settlement behavior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          approved
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A]">
                          true (with wallet)
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Cleared for immediate SPL Token-2022 ATA provisioning
                          and token transfer.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#0A0A0A] font-medium">
                          pending
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#737373]">
                          false
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Awaiting identity or accreditation documents;
                          subscriptions remain in <code className={inlineCode}>pending</code>{' '}
                          state.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-[#737373]">
                          rejected / suspended
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#737373]">
                          false
                        </td>
                        <td className="py-3.5 px-5 text-[#404040]">
                          Hard compliance block: calling{' '}
                          <code className={inlineCode}>/subscriptions/:id/settle</code>{' '}
                          returns <code className={inlineCode}>403 KYC_NOT_APPROVED</code>.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                id="kyc-webhook-pattern"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Connecting Sumsub / Persona webhooks to <code className="font-mono text-[19px]">/kyc</code>
                </h2>
                <p className="text-[#404040] text-pretty">
                  In production architectures, your backend receives a signed
                  webhook from your identity vendor when an applicant passes
                  verification, and immediately forwards the decision to
                  3rdfloor&apos;s <code className={inlineCode}>/kyc</code>{' '}
                  endpoint:
                </p>

                <CodeBlock
                  title="app/api/webhooks/kyc-provider/route.ts"
                  language="typescript"
                  code={`export async function POST(req: Request) {
  const event = await req.json();

  // Map external KYC webhook event to 3rdfloor Investor KYC endpoint
  const response = await fetch(
    \`http://localhost:3000/api/v1/investors/\${event.externalUserId}/kyc\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${process.env.THREEFLOOR_SECRET_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kycStatus: event.reviewResult === "GREEN" ? "approved" : "rejected",
        investorType: event.accreditationTier || "accredited",
        walletAddress: event.verifiedSolanaWallet,
        provider: "sumsub",
        referenceId: event.inspectionId,
      }),
    }
  );

  return Response.json(await response.json());
}`}
                  surface="light"
                />
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 7: SUBSCRIPTIONS & IDEMPOTENT ATA SETTLEMENT
              ================================================================= */}
          {activePageId === 'subscriptions-settlement' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section id="why-two-phase" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Why commitment and settlement are decoupled
                </h2>
                <p className="text-[#404040] text-pretty">
                  In institutional securities issuance, an investor&apos;s
                  subscription commitment (executing a Subscription Agreement
                  and initiating a Fedwire, SWIFT transfer, or USDC escrow) is
                  asynchronous from final asset settlement. 3rdfloor models this
                  cleanly with a two-phase protocol so you can lock in investor
                  orders while fiat wires or final KYC reviews clear.
                </p>
              </section>

              <section
                id="two-phase-settlement"
                className="scroll-mt-24 space-y-5"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Two-phase settlement walkthrough
                </h2>
                <ol className="list-decimal pl-5 space-y-4 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Phase 1 — Record subscription commitment (
                      <code className={inlineCode}>
                        POST /api/v1/offerings/:offeringId/subscriptions
                      </code>
                      ):
                    </strong>{' '}
                    Validates that the offering is <code className={inlineCode}>open</code>,
                    computes the token allocation (<code className={inlineCode}>amountUsd / tokenPrice</code>),
                    verifies that the request does not exceed the offering&apos;s
                    unallocated <code className={inlineCode}>tokenSupply</code>,
                    and creates a <code className={inlineCode}>pending</code>{' '}
                    subscription record.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Phase 2 — Settle on Solana Devnet (
                      <code className={inlineCode}>
                        POST /api/v1/subscriptions/:subscriptionId/settle
                      </code>
                      ):
                    </strong>{' '}
                    Verifies that the investor&apos;s KYC status is not{' '}
                    <code className={inlineCode}>rejected</code> or{' '}
                    <code className={inlineCode}>suspended</code>, deterministically
                    derives and provisions the investor&apos;s Associated Token
                    Account (ATA) for the offering&apos;s Token-2022 mint,
                    transfers the exact token quantity from the issuer treasury,
                    and records the confirmed Solana{' '}
                    <code className={inlineCode}>transactionSignature</code>.
                  </li>
                </ol>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`# Phase 1: Record $5,000 subscription commitment (500 MFR tokens @ $10/token)
curl -X POST "http://localhost:3000/api/v1/offerings/1/subscriptions" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "investorWallet": "GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX",
    "amountUsd": 5000,
    "investorEmail": "treasury@apex-lp.io"
  }'

# Phase 2: Settle subscription #12 & transfer 500 MFR tokens to investor ATA
curl -X POST "http://localhost:3000/api/v1/subscriptions/12/settle" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json"`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>

              <section
                id="idempotency-guarantees"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Idempotency, KYC gates &amp; supply guards
                </h2>
                <p className="text-[#404040] text-pretty">
                  Network timeouts during blockchain settlement can cause
                  catastrophic double-allocations if an API is not idempotent.
                  3rdfloor enforces three settlement invariants:
                </p>
                <ul className="list-disc pl-5 space-y-2.5 text-[#333333]">
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Strict replay safety:
                    </strong>{' '}
                    If a subscription is already in{' '}
                    <code className={inlineCode}>status: &quot;settled&quot;</code>,
                    subsequent calls to <code className={inlineCode}>/settle</code>{' '}
                    immediately return <code className={inlineCode}>200 OK</code>{' '}
                    with <code className={inlineCode}>idempotentReplay: true</code>{' '}
                    and the original Solana{' '}
                    <code className={inlineCode}>transactionSignature</code>{' '}
                    without submitting a duplicate transaction.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Automated KYC enforcement:
                    </strong>{' '}
                    If the destination wallet belongs to an investor whose KYC
                    status was marked <code className={inlineCode}>rejected</code>{' '}
                    or <code className={inlineCode}>suspended</code> via{' '}
                    <code className={inlineCode}>/investors/:id/kyc</code>,
                    settlement is rejected with{' '}
                    <code className={inlineCode}>403 KYC_NOT_APPROVED</code>.
                  </li>
                  <li>
                    <strong className="text-[#0A0A0A] font-medium">
                      Hard treasury supply ceiling:
                    </strong>{' '}
                    The sum of all settled token allocations can never exceed
                    the offering&apos;s <code className={inlineCode}>tokenSupply</code>.
                  </li>
                </ul>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 8: CAP TABLE & PRO-RATA YIELD DISTRIBUTIONS
              ================================================================= */}
          {activePageId === 'captable-distributions' && (
            <div className="space-y-14 text-[15px] text-[#333333] leading-[1.8]">
              <section
                id="reconciled-captable"
                className="scroll-mt-24 space-y-4"
              >
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Continuous on-chain cap table reconciliation
                </h2>
                <p className="text-[#404040] text-pretty">
                  Traditional transfer agents rely on manual spreadsheets that
                  quickly drift out of sync with actual settlement records.
                  Calling{' '}
                  <code className={inlineCode}>
                    GET /api/v1/offerings/:offeringId/holdings
                  </code>{' '}
                  computes a real-time, reconciled cap table across all settled
                  SPL Token-2022 subscriptions for that offering—returning total
                  minted supply, circulating allocated tokens, unallocated
                  treasury reserve, and per-wallet ownership percentages with
                  Solana Devnet transaction proofs.
                </p>
              </section>

              <section id="pro-rata-payouts" className="scroll-mt-24 space-y-4">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] leading-[1.25] text-[#0A0A0A] text-balance">
                  Pro-rata yield &amp; dividend calculation engine
                </h2>
                <p className="text-[#404040] text-pretty">
                  When an underlying property collects commercial rent or a
                  private credit pool receives quarterly coupon payments, call{' '}
                  <code className={inlineCode}>
                    POST /api/v1/offerings/:offeringId/distributions
                  </code>{' '}
                  with the total USD payout pool. 3rdfloor snapshots all settled
                  token holders and computes each holder&apos;s exact dollar
                  entitlement proportional to their settled token balance:
                </p>

                <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] font-mono text-[13px] text-[#0A0A0A]">
                  Holder Entitlement (USD) = Total Distribution Pool (USD) &times; (Holder Settled Tokens / Total Allocated Tokens)
                </div>

                <CodeBlock
                  title="Terminal"
                  language="bash"
                  code={`curl -X POST "http://localhost:3000/api/v1/offerings/1/distributions" \\
  -H "Authorization: Bearer ${displayedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Q4 2026 Commercial Rental Yield",
    "totalAmountUsd": 25000
  }'`}
                  canMaskKey
                  isMasked={maskKey}
                  onToggleMask={() => setMaskKey(!maskKey)}
                  surface="light"
                />
              </section>
            </div>
          )}

          {/* =================================================================
              PAGE 9: INTERACTIVE API SANDBOX
              ================================================================= */}
          {activePageId === 'api-sandbox' && (
            <div className="space-y-8">
              <section
                id="sandbox-key-config"
                className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-medium text-[#0A0A0A]">
                      1. Workspace secret key (
                      <code className="font-mono">3f_live_...</code>)
                    </h2>
                    <p className="text-[13px] text-[#525252] mt-1">
                      Paste an active API key from{' '}
                      <code className="font-mono text-[#0A0A0A]">
                        /org/[id]/developers
                      </code>{' '}
                      to authenticate live requests against your workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaskKey(!maskKey)}
                    className="h-8 px-3 rounded-full border border-[#E5E5E5] bg-white text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center gap-1.5 cursor-pointer"
                  >
                    {maskKey ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                    <span>{maskKey ? 'Reveal' : 'Mask'}</span>
                  </button>
                </div>

                <input
                  type={maskKey ? 'password' : 'text'}
                  value={sandboxKey}
                  onChange={(e) => setSandboxKey(e.target.value)}
                  placeholder="Paste 3f_live_... secret key here"
                  className="w-full h-10 px-4 rounded-xl border border-[#E5E5E5] bg-white font-mono text-[13px] text-[#0A0A0A] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0A0A0A]"
                />
              </section>

              <section
                id="sandbox-executor"
                className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden scroll-mt-24"
              >
                <div className="p-6 border-b border-[#E5E5E5] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-medium text-[#0A0A0A]">
                      2. Request builder &amp; live executor
                    </h2>
                    <p className="text-[13px] text-[#525252] mt-1">
                      {selectedSandboxEp.summary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={runSandboxRequest}
                    disabled={sandboxResult?.loading}
                    className="h-9 px-5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#262626] text-[13px] font-normal flex items-center gap-2 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>
                      {sandboxResult?.loading ? 'Executing...' : 'Send request'}
                    </span>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-[12.5px] font-medium text-[#525252]">
                        Endpoint route
                      </label>
                      <select
                        value={sandboxEndpointId}
                        onChange={(e) =>
                          handleSelectSandboxEndpoint(e.target.value)
                        }
                        className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] bg-white text-[13px] font-mono text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                      >
                        {ENDPOINTS.map((ep) => (
                          <option key={ep.id} value={ep.id}>
                            [{ep.method}] {ep.path} — {ep.summary}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedSandboxEp.pathParamName && (
                      <div className="space-y-2">
                        <label className="block text-[12.5px] font-medium text-[#525252]">
                          Param (:{selectedSandboxEp.pathParamName})
                        </label>
                        <input
                          type="text"
                          value={sandboxPathParam}
                          onChange={(e) => setSandboxPathParam(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] bg-white text-[13px] font-mono text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] tabular-nums"
                        />
                      </div>
                    )}
                  </div>

                  {(selectedSandboxEp.method === 'POST' ||
                    selectedSandboxEp.method === 'PATCH') && (
                    <div className="space-y-2">
                      <label className="block text-[12.5px] font-medium text-[#525252]">
                        JSON request body
                      </label>
                      <textarea
                        rows={7}
                        value={sandboxBodyJson}
                        onChange={(e) => setSandboxBodyJson(e.target.value)}
                        className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-white font-mono text-[13px] text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] leading-[1.6]"
                      />
                    </div>
                  )}

                  {sandboxResult && !sandboxResult.loading && (
                    <CodeBlock
                      title={`HTTP ${sandboxResult.status} (${sandboxResult.latencyMs} ms)`}
                      language="json"
                      code={sandboxResult.body}
                      surface="light"
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              PAGES 10-14: API REFERENCE ENDPOINT SECTIONS
              ================================================================= */}
          {activePageId.startsWith('api-') && activePageId !== 'api-sandbox' && (
            <div className="space-y-14">
              {ENDPOINTS.filter((ep) => ep.category === activePageId).map(
                (ep) => (
                  <section
                    key={ep.id}
                    id={ep.id}
                    className="space-y-5 scroll-mt-24 pb-12 border-b border-[#E5E5E5] last:border-b-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-md font-mono text-[11.5px] font-medium ${
                            ep.method === 'GET'
                              ? 'bg-[#F4F4F5] text-[#0A0A0A] border border-[#E4E4E7]'
                              : 'bg-[#0A0A0A] text-white'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <code className="font-mono text-[15px] font-semibold text-[#0A0A0A]">
                          {ep.path}
                        </code>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEndpointInSandbox(ep)}
                        className="h-8 px-4 rounded-full border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[12.5px] text-[#0A0A0A] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Test in sandbox</span>
                      </button>
                    </div>

                    <h2 className="text-[20px] font-medium tracking-[-0.015em] text-[#0A0A0A] text-balance">
                      {ep.summary}
                    </h2>
                    <p className="text-[15px] text-[#404040] text-pretty leading-[1.75]">
                      {ep.description}
                    </p>

                    {ep.params && ep.params.length > 0 && (
                      <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden my-5">
                        <table className="w-full text-left border-collapse text-[13.5px]">
                          <thead>
                            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] font-medium">
                              <th className="py-3 px-4">Field</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5E5]">
                            {ep.params.map((p) => (
                              <tr key={p.name}>
                                <td className="py-3.5 px-4 font-mono text-[#0A0A0A] font-medium">
                                  {p.name}
                                  {p.required && (
                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A] text-white uppercase">
                                      req
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-[#737373]">
                                  {p.type}
                                </td>
                                <td className="py-3.5 px-4 text-[#404040] leading-[1.6]">
                                  {p.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <CodeBlock
                      tabs={[
                        { id: 'curl', label: 'cURL' },
                        { id: 'typescript', label: 'TypeScript' },
                      ]}
                      activeTab={
                        codeTab === 'typescript' ? 'typescript' : 'curl'
                      }
                      onTabChange={(id) => setCodeTab(id as any)}
                      title={
                        codeTab === 'typescript'
                          ? `${ep.method} ${ep.path}`
                          : 'Terminal'
                      }
                      language={
                        codeTab === 'typescript' ? 'typescript' : 'bash'
                      }
                      code={buildEndpointSnippet(ep)}
                      canMaskKey
                      isMasked={maskKey}
                      onToggleMask={() => setMaskKey(!maskKey)}
                      surface="light"
                    />

                    <CodeBlock
                      title="Response (200 OK)"
                      language="json"
                      code={JSON.stringify(ep.sampleResponse, null, 2)}
                      surface="light"
                    />
                  </section>
                )
              )}
            </div>
          )}

          {/* Previous / Next Page Footer Navigation */}
          <div className="mt-16 pt-8 border-t border-[#E5E5E5] flex items-center justify-between gap-4">
            {prevPage ? (
              <button
                type="button"
                onClick={() => navigateToPage(prevPage.id)}
                className="text-left group cursor-pointer"
              >
                <div className="text-[12px] text-[#737373]">&larr; Previous</div>
                <div className="text-[15px] font-medium text-[#0A0A0A] group-hover:opacity-65 mt-1 transition-opacity">
                  {prevPage.title}
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextPage ? (
              <button
                type="button"
                onClick={() => navigateToPage(nextPage.id)}
                className="text-right group cursor-pointer"
              >
                <div className="text-[12px] text-[#737373]">Next &rarr;</div>
                <div className="text-[15px] font-medium text-[#0A0A0A] group-hover:opacity-65 mt-1 transition-opacity">
                  {nextPage.title}
                </div>
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>

        {/* Column 3: Right "On this page" + Specs Rail */}
        <aside className="hidden xl:block w-64 shrink-0 py-12 pr-8">
          <div className="sticky top-28 space-y-8">
            <div>
              <div className="text-[12px] font-medium text-[#0A0A0A] mb-3.5 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#0A0A0A]" />
                <span>On this page</span>
              </div>
              <ul className="border-l border-[#E5E5E5] space-y-2.5 text-[13px]">
                {currentPage.toc.map((item) => {
                  const active = activeTocId === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={() => setActiveTocId(item.id)}
                        className={`block pl-3.5 -ml-px border-l-2 transition-colors leading-[1.45] ${
                          active
                            ? 'border-[#0A0A0A] text-[#0A0A0A] font-medium'
                            : 'border-transparent text-[#6B6B6B] hover:text-[#0A0A0A]'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3 text-[12.5px]">
              <div className="text-[12px] font-medium text-[#0A0A0A]">
                Specification
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">API</span>
                <span className="font-mono text-[#0A0A0A]">REST v1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Standard</span>
                <span className="font-mono text-[#0A0A0A]">Token-2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">KYC Gate</span>
                <span className="font-mono text-[#0A0A0A]">/investors/:id/kyc</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Auth</span>
                <span className="font-mono text-[#0A0A0A]">3f_live_...</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
