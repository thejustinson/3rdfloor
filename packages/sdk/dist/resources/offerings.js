export class OfferingsResource {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Lists all investment offerings and deployed SPL Token-2022 mint records for your workspace.
     */
    async list() {
        return this.client.request('GET', '/offerings');
    }
    /**
     * Creates a new investment offering linked to an existing asset and configures its SPL Token-2022 tokenomics.
     */
    async create(input) {
        return this.client.request('POST', '/offerings', input);
    }
    /**
     * Retrieves offering details, deployed Token-2022 mint record, subscriptions, and distributions.
     */
    async get(offeringId) {
        return this.client.request('GET', `/offerings/${offeringId}`);
    }
    /**
     * Transitions an offering's status (`draft`, `under_review`, `approved`, `open`, `paused`, `closed`)
     * and optionally deploys the Solana SPL Token-2022 mint when `deployToken: true`.
     */
    async updateStatus(offeringId, input) {
        return this.client.request('POST', `/offerings/${offeringId}/status`, input);
    }
    /**
     * Convenience method to atomically open an offering and initialize its SPL Token-2022 mint on Solana.
     */
    async deployToken(offeringId) {
        return this.updateStatus(offeringId, {
            status: 'open',
            deployToken: true,
        });
    }
    /**
     * Retrieves the reconciled on-chain token holder cap table for an offering.
     */
    async getHoldings(offeringId) {
        return this.client.request('GET', `/offerings/${offeringId}/holdings`);
    }
    /**
     * Lists historical yield/dividend distributions for an offering.
     */
    async listDistributions(offeringId) {
        return this.client.request('GET', `/offerings/${offeringId}/distributions`);
    }
    /**
     * Declares and executes a pro-rata USD yield distribution across all settled token holders.
     */
    async createDistribution(offeringId, input) {
        return this.client.request('POST', `/offerings/${offeringId}/distributions`, input);
    }
}
//# sourceMappingURL=offerings.js.map