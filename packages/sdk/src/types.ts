/**
 * Configuration options for initializing the 3rdfloor SDK client.
 */
export interface ThirdFloorConfig {
  /**
   * Workspace-scoped secret API key prefixed with `3f_live_...`.
   * Generate keys inside `/org/[id]/developers` in your 3rdfloor dashboard.
   */
  apiKey: string;
  /**
   * Base URL for the 3rdfloor REST API v1.
   * @default "http://localhost:3000/api/v1"
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeoutMs?: number;
  /**
   * Optional custom fetch implementation (defaults to global `fetch`).
   */
  fetch?: typeof fetch;
}

export interface ApiMeta {
  timestamp?: string;
  total?: number;
  upserted?: boolean;
  idempotent?: boolean;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    status?: number;
  };
}

// ============================================================================
// Investors & KYC Types
// ============================================================================

export type InvestorType =
  | 'individual'
  | 'accredited'
  | 'institutional'
  | 'qualified_purchaser';

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Investor {
  id: number;
  organizationId: number;
  name: string;
  email: string;
  walletAddress: string | null;
  investorType: InvestorType;
  jurisdiction: string;
  kycStatus: KycStatus;
  createdAt?: string;
  subscriptionsCount?: number;
  settledSubscriptionsCount?: number;
  totalInvestedUsd?: number;
  totalTokensHeld?: number;
}

export interface CreateInvestorInput {
  name: string;
  email: string;
  walletAddress?: string;
  investorType?: InvestorType;
  jurisdiction?: string;
  kycStatus?: KycStatus;
}

export interface UpdateInvestorInput {
  name?: string;
  walletAddress?: string | null;
  investorType?: InvestorType;
  jurisdiction?: string;
  kycStatus?: KycStatus;
}

export interface InvestorSubscriptionSummary {
  id: number;
  offeringId: number;
  offeringName: string;
  tokenSymbol: string | null;
  investorWallet: string | null;
  amountUsd: string;
  tokenQuantity: string | null;
  status: string;
  transactionSignature: string | null;
  createdAt?: string;
}

export interface InvestorWithSubscriptions extends Investor {
  subscriptions: InvestorSubscriptionSummary[];
}

export interface KycComplianceChecks {
  identityVerified: boolean;
  accreditationAttested: boolean;
  sanctionsScreened: boolean;
  walletWhitelisted: boolean;
}

export interface KycVerificationMeta {
  provider: string;
  referenceId: string;
  notes: string | null;
  evaluatedAt: string;
}

export interface InvestorKycRecord {
  investorId: number;
  organizationId: number;
  name: string;
  email: string;
  kycStatus: KycStatus;
  investorType: InvestorType;
  jurisdiction: string;
  walletAddress: string | null;
  eligibleForSettlement: boolean;
  complianceChecks: KycComplianceChecks;
  verification: KycVerificationMeta;
}

export interface VerifyInvestorKycInput {
  kycStatus: KycStatus;
  investorType?: InvestorType;
  jurisdiction?: string;
  walletAddress?: string;
  provider?: string;
  referenceId?: string;
  notes?: string;
}

// ============================================================================
// Assets Types
// ============================================================================

export type AssetCategory =
  | 'Real Estate'
  | 'Private Credit'
  | 'Fine Art'
  | 'Infrastructure'
  | (string & {});

export interface Asset {
  id: number;
  organizationId: number;
  name: string;
  category: AssetCategory;
  declaredValuation: string | null;
  currency: string;
  description: string | null;
  status: string;
  createdAt?: string;
}

export interface CreateAssetInput {
  name: string;
  category: AssetCategory;
  declaredValuation?: number;
  currency?: string;
  description?: string;
}

export interface AssetWithOfferings extends Asset {
  offerings: Offering[];
}

// ============================================================================
// Offerings & Token-2022 Types
// ============================================================================

export type OfferingStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'open'
  | 'paused'
  | 'closed';

export interface TokenRecord {
  id?: number;
  offeringId?: number;
  mintAddress: string;
  decimals: number;
  mintAuthority?: string;
  freezeAuthority?: string;
  transactionSignature?: string;
}

export interface Offering {
  id: number;
  organizationId: number;
  assetId: number;
  name: string;
  description: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  maxInvestment: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenStandard: string | null;
  tokenSupply: string | null;
  tokenPrice: string | null;
  status: OfferingStatus;
  tokens?: TokenRecord[];
  asset?: Asset;
  createdAt?: string;
}

export interface CreateOfferingInput {
  assetId: number;
  name: string;
  description?: string;
  targetRaise: number;
  minInvestment?: number;
  maxInvestment?: number;
  tokenName?: string;
  tokenSymbol: string;
  tokenStandard?: string;
  tokenSupply: number;
  tokenPrice: number;
}

export interface TransitionOfferingStatusInput {
  status: OfferingStatus;
  deployToken?: boolean;
}

export interface TokenDeploymentResult {
  mintAddress: string;
  txSignature?: string;
  transactionSignature?: string;
  solanaExplorerUrl?: string;
}

export interface TransitionOfferingStatusResult {
  offering: Offering;
  tokenDeployment?: TokenDeploymentResult | null;
}

// ============================================================================
// Subscriptions & Settlement Types
// ============================================================================

export interface Subscription {
  id: number;
  offeringId: number;
  userId: string;
  investorWallet: string | null;
  amountUsd: string;
  tokenQuantity: string | null;
  status: 'pending' | 'settled' | 'cancelled';
  transactionSignature: string | null;
  createdAt?: string;
}

export interface CreateSubscriptionInput {
  investorWallet: string;
  amountUsd: number;
  tokenQuantity?: number;
  investorEmail?: string;
  userId?: string;
}

export interface SettleSubscriptionResult {
  subscription: Subscription;
  solanaExplorerUrl?: string;
  idempotentReplay?: boolean;
}

// ============================================================================
// Cap Table & Distributions Types
// ============================================================================

export interface TokenHolder {
  investorWallet: string;
  tokenBalance: number;
  ownershipPercentage: number;
  totalInvestedUsd?: number;
  subscriptionsCount?: number;
  lastTransactionSignature?: string | null;
}

export interface OfferingHoldings {
  offeringId: number;
  offeringName?: string;
  tokenSymbol?: string | null;
  mintAddress: string | null;
  totalSupply: number;
  allocatedTokens: number;
  unallocatedSupply?: number;
  holders: TokenHolder[];
}

export interface CreateDistributionInput {
  title: string;
  totalAmountUsd: number;
}

export interface Distribution {
  id: number;
  offeringId: number;
  title: string;
  totalAmountUsd: string;
  status: string;
  createdAt?: string;
}

export interface HolderEntitlement {
  investorWallet: string;
  tokenQuantity: number;
  sharePercentage: number;
  payoutAmountUsd: number;
}

export interface DistributionResult {
  distribution: Distribution;
  entitlements: HolderEntitlement[];
}
