import type { HttpClient } from '../client';
import type {
  CreateSubscriptionInput,
  SettleSubscriptionResult,
  Subscription,
} from '../types';

export class SubscriptionsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists all primary investor subscriptions for an offering.
   */
  public async list(offeringId: number): Promise<Subscription[]> {
    return this.client.request<Subscription[]>(
      'GET',
      `/offerings/${offeringId}/subscriptions`
    );
  }

  /**
   * Records a primary investor subscription commitment against an open offering.
   */
  public async create(
    offeringId: number,
    input: CreateSubscriptionInput
  ): Promise<Subscription> {
    return this.client.request<Subscription>(
      'POST',
      `/offerings/${offeringId}/subscriptions`,
      input
    );
  }

  /**
   * Idempotently settles a pending subscription by verifying investor KYC,
   * provisioning their Associated Token Account (ATA) on Solana, and transferring
   * the allocated SPL Token-2022 units.
   */
  public async settle(subscriptionId: number): Promise<SettleSubscriptionResult> {
    return this.client.request<SettleSubscriptionResult>(
      'POST',
      `/subscriptions/${subscriptionId}/settle`
    );
  }
}
