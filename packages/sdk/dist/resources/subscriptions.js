export class SubscriptionsResource {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Lists all primary investor subscriptions for an offering.
     */
    async list(offeringId) {
        return this.client.request('GET', `/offerings/${offeringId}/subscriptions`);
    }
    /**
     * Records a primary investor subscription commitment against an open offering.
     */
    async create(offeringId, input) {
        return this.client.request('POST', `/offerings/${offeringId}/subscriptions`, input);
    }
    /**
     * Idempotently settles a pending subscription by verifying investor KYC,
     * provisioning their Associated Token Account (ATA) on Solana, and transferring
     * the allocated SPL Token-2022 units.
     */
    async settle(subscriptionId) {
        return this.client.request('POST', `/subscriptions/${subscriptionId}/settle`);
    }
}
//# sourceMappingURL=subscriptions.js.map