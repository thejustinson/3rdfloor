import type { HttpClient } from '../client';
import type { CreateInvestorInput, Investor, InvestorKycRecord, InvestorWithSubscriptions, UpdateInvestorInput, VerifyInvestorKycInput } from '../types';
export declare class InvestorsResource {
    private readonly client;
    constructor(client: HttpClient);
    /**
     * Lists all registered and subscription-derived investors for your organization workspace.
     */
    list(): Promise<Investor[]>;
    /**
     * Onboards a new investor profile or idempotently updates an existing profile matched by email or wallet.
     */
    create(input: CreateInvestorInput): Promise<Investor>;
    /**
     * Retrieves a single investor profile along with their subscription history across workspace offerings.
     */
    get(investorId: number): Promise<InvestorWithSubscriptions>;
    /**
     * Partially updates an investor's profile attributes (name, walletAddress, investorType, jurisdiction, kycStatus).
     */
    update(investorId: number, input: UpdateInvestorInput): Promise<Investor>;
    /**
     * Retrieves the dedicated KYC verification record, accreditation attestation,
     * wallet whitelist status, and computed `eligibleForSettlement` boolean for an investor.
     */
    getKyc(investorId: number): Promise<InvestorKycRecord>;
    /**
     * Submits or updates an investor's KYC determination (`approved`, `pending`, `rejected`, `suspended`),
     * accreditation classification, and whitelisted Solana wallet address.
     */
    verifyKyc(investorId: number, input: VerifyInvestorKycInput): Promise<InvestorKycRecord>;
}
//# sourceMappingURL=investors.d.ts.map