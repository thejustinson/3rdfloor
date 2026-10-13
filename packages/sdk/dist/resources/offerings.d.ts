import type { HttpClient } from '../client';
import type { CreateDistributionInput, CreateOfferingInput, Distribution, DistributionResult, Offering, OfferingHoldings, TransitionOfferingStatusInput, TransitionOfferingStatusResult } from '../types';
export declare class OfferingsResource {
    private readonly client;
    constructor(client: HttpClient);
    /**
     * Lists all investment offerings and deployed SPL Token-2022 mint records for your workspace.
     */
    list(): Promise<Offering[]>;
    /**
     * Creates a new investment offering linked to an existing asset and configures its SPL Token-2022 tokenomics.
     */
    create(input: CreateOfferingInput): Promise<Offering>;
    /**
     * Retrieves offering details, deployed Token-2022 mint record, subscriptions, and distributions.
     */
    get(offeringId: number): Promise<Offering>;
    /**
     * Transitions an offering's status (`draft`, `under_review`, `approved`, `open`, `paused`, `closed`)
     * and optionally deploys the Solana SPL Token-2022 mint when `deployToken: true`.
     */
    updateStatus(offeringId: number, input: TransitionOfferingStatusInput): Promise<TransitionOfferingStatusResult>;
    /**
     * Convenience method to atomically open an offering and initialize its SPL Token-2022 mint on Solana.
     */
    deployToken(offeringId: number): Promise<TransitionOfferingStatusResult>;
    /**
     * Retrieves the reconciled on-chain token holder cap table for an offering.
     */
    getHoldings(offeringId: number): Promise<OfferingHoldings>;
    /**
     * Lists historical yield/dividend distributions for an offering.
     */
    listDistributions(offeringId: number): Promise<Distribution[]>;
    /**
     * Declares and executes a pro-rata USD yield distribution across all settled token holders.
     */
    createDistribution(offeringId: number, input: CreateDistributionInput): Promise<DistributionResult>;
}
//# sourceMappingURL=offerings.d.ts.map