import type { HttpClient } from '../client';
import type {
  CreateDistributionInput,
  CreateOfferingInput,
  Distribution,
  DistributionResult,
  Offering,
  OfferingHoldings,
  TransitionOfferingStatusInput,
  TransitionOfferingStatusResult,
} from '../types';

export class OfferingsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists all investment offerings and deployed SPL Token-2022 mint records for your workspace.
   */
  public async list(): Promise<Offering[]> {
    return this.client.request<Offering[]>('GET', '/offerings');
  }

  /**
   * Creates a new investment offering linked to an existing asset and configures its SPL Token-2022 tokenomics.
   */
  public async create(input: CreateOfferingInput): Promise<Offering> {
    return this.client.request<Offering>('POST', '/offerings', input);
  }

  /**
   * Retrieves offering details, deployed Token-2022 mint record, subscriptions, and distributions.
   */
  public async get(offeringId: number): Promise<Offering> {
    return this.client.request<Offering>('GET', `/offerings/${offeringId}`);
  }

  /**
   * Transitions an offering's status (`draft`, `under_review`, `approved`, `open`, `paused`, `closed`)
   * and optionally deploys the Solana SPL Token-2022 mint when `deployToken: true`.
   */
  public async updateStatus(
    offeringId: number,
    input: TransitionOfferingStatusInput
  ): Promise<TransitionOfferingStatusResult> {
    return this.client.request<TransitionOfferingStatusResult>(
      'POST',
      `/offerings/${offeringId}/status`,
      input
    );
  }

  /**
   * Convenience method to atomically open an offering and initialize its SPL Token-2022 mint on Solana.
   */
  public async deployToken(
    offeringId: number
  ): Promise<TransitionOfferingStatusResult> {
    return this.updateStatus(offeringId, {
      status: 'open',
      deployToken: true,
    });
  }

  /**
   * Retrieves the reconciled on-chain token holder cap table for an offering.
   */
  public async getHoldings(offeringId: number): Promise<OfferingHoldings> {
    return this.client.request<OfferingHoldings>(
      'GET',
      `/offerings/${offeringId}/holdings`
    );
  }

  /**
   * Lists historical yield/dividend distributions for an offering.
   */
  public async listDistributions(offeringId: number): Promise<Distribution[]> {
    return this.client.request<Distribution[]>(
      'GET',
      `/offerings/${offeringId}/distributions`
    );
  }

  /**
   * Declares and executes a pro-rata USD yield distribution across all settled token holders.
   */
  public async createDistribution(
    offeringId: number,
    input: CreateDistributionInput
  ): Promise<DistributionResult> {
    return this.client.request<DistributionResult>(
      'POST',
      `/offerings/${offeringId}/distributions`,
      input
    );
  }
}
