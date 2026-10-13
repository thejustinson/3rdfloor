import type { HttpClient } from '../client';
import type {
  CreateInvestorInput,
  Investor,
  InvestorKycRecord,
  InvestorWithSubscriptions,
  UpdateInvestorInput,
  VerifyInvestorKycInput,
} from '../types';

export class InvestorsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists all registered and subscription-derived investors for your organization workspace.
   */
  public async list(): Promise<Investor[]> {
    return this.client.request<Investor[]>('GET', '/investors');
  }

  /**
   * Onboards a new investor profile or idempotently updates an existing profile matched by email or wallet.
   */
  public async create(input: CreateInvestorInput): Promise<Investor> {
    return this.client.request<Investor>('POST', '/investors', input);
  }

  /**
   * Retrieves a single investor profile along with their subscription history across workspace offerings.
   */
  public async get(investorId: number): Promise<InvestorWithSubscriptions> {
    return this.client.request<InvestorWithSubscriptions>(
      'GET',
      `/investors/${investorId}`
    );
  }

  /**
   * Partially updates an investor's profile attributes (name, walletAddress, investorType, jurisdiction, kycStatus).
   */
  public async update(
    investorId: number,
    input: UpdateInvestorInput
  ): Promise<Investor> {
    return this.client.request<Investor>(
      'PATCH',
      `/investors/${investorId}`,
      input
    );
  }

  /**
   * Retrieves the dedicated KYC verification record, accreditation attestation,
   * wallet whitelist status, and computed `eligibleForSettlement` boolean for an investor.
   */
  public async getKyc(investorId: number): Promise<InvestorKycRecord> {
    return this.client.request<InvestorKycRecord>(
      'GET',
      `/investors/${investorId}/kyc`
    );
  }

  /**
   * Submits or updates an investor's KYC determination (`approved`, `pending`, `rejected`, `suspended`),
   * accreditation classification, and whitelisted Solana wallet address.
   */
  public async verifyKyc(
    investorId: number,
    input: VerifyInvestorKycInput
  ): Promise<InvestorKycRecord> {
    return this.client.request<InvestorKycRecord>(
      'POST',
      `/investors/${investorId}/kyc`,
      input
    );
  }
}
