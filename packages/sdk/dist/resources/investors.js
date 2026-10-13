export class InvestorsResource {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Lists all registered and subscription-derived investors for your organization workspace.
     */
    async list() {
        return this.client.request('GET', '/investors');
    }
    /**
     * Onboards a new investor profile or idempotently updates an existing profile matched by email or wallet.
     */
    async create(input) {
        return this.client.request('POST', '/investors', input);
    }
    /**
     * Retrieves a single investor profile along with their subscription history across workspace offerings.
     */
    async get(investorId) {
        return this.client.request('GET', `/investors/${investorId}`);
    }
    /**
     * Partially updates an investor's profile attributes (name, walletAddress, investorType, jurisdiction, kycStatus).
     */
    async update(investorId, input) {
        return this.client.request('PATCH', `/investors/${investorId}`, input);
    }
    /**
     * Retrieves the dedicated KYC verification record, accreditation attestation,
     * wallet whitelist status, and computed `eligibleForSettlement` boolean for an investor.
     */
    async getKyc(investorId) {
        return this.client.request('GET', `/investors/${investorId}/kyc`);
    }
    /**
     * Submits or updates an investor's KYC determination (`approved`, `pending`, `rejected`, `suspended`),
     * accreditation classification, and whitelisted Solana wallet address.
     */
    async verifyKyc(investorId, input) {
        return this.client.request('POST', `/investors/${investorId}/kyc`, input);
    }
}
//# sourceMappingURL=investors.js.map