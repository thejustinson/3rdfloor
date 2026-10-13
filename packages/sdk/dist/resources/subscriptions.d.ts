import type { HttpClient } from '../client';
import type { CreateSubscriptionInput, SettleSubscriptionResult, Subscription } from '../types';
export declare class SubscriptionsResource {
    private readonly client;
    constructor(client: HttpClient);
    /**
     * Lists all primary investor subscriptions for an offering.
     */
    list(offeringId: number): Promise<Subscription[]>;
    /**
     * Records a primary investor subscription commitment against an open offering.
     */
    create(offeringId: number, input: CreateSubscriptionInput): Promise<Subscription>;
    /**
     * Idempotently settles a pending subscription by verifying investor KYC,
     * provisioning their Associated Token Account (ATA) on Solana, and transferring
     * the allocated SPL Token-2022 units.
     */
    settle(subscriptionId: number): Promise<SettleSubscriptionResult>;
}
//# sourceMappingURL=subscriptions.d.ts.map