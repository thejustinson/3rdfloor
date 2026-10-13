import { HttpClient } from './client';
import { AssetsResource } from './resources/assets';
import { InvestorsResource } from './resources/investors';
import { OfferingsResource } from './resources/offerings';
import { SubscriptionsResource } from './resources/subscriptions';
import type { ThirdFloorConfig } from './types';

/**
 * Official 3rdfloor TypeScript SDK client for Real-World Asset (RWA) tokenization,
 * Investor KYC verification, and Solana SPL Token-2022 settlement.
 *
 * @example
 * ```ts
 * import { ThirdFloor } from '@3rdfloor/sdk';
 *
 * const rwa = new ThirdFloor({
 *   apiKey: process.env.THREEFLOOR_SECRET_KEY!,
 *   baseUrl: 'http://localhost:3000/api/v1',
 * });
 *
 * const kyc = await rwa.investors.verifyKyc(1, {
 *   kycStatus: 'approved',
 *   investorType: 'qualified_purchaser',
 *   walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
 * });
 * ```
 */
export class ThirdFloor {
  private readonly http: HttpClient;

  /**
   * Manage investor profiles, KYC determinations (`/kyc`), accreditation tiers,
   * and whitelisted Solana wallets.
   */
  public readonly investors: InvestorsResource;

  /**
   * Catalog and query underlying real-world collateral (Real Estate, Private Credit,
   * Fine Art, Infrastructure).
   */
  public readonly assets: AssetsResource;

  /**
   * Configure investment offerings, deploy Solana SPL Token-2022 mints, query
   * reconciled cap tables, and execute pro-rata yield distributions.
   */
  public readonly offerings: OfferingsResource;

  /**
   * Record primary investor subscription commitments and execute idempotent
   * Token-2022 Associated Token Account (ATA) settlements on Solana.
   */
  public readonly subscriptions: SubscriptionsResource;

  constructor(config: ThirdFloorConfig) {
    this.http = new HttpClient(config);
    this.investors = new InvestorsResource(this.http);
    this.assets = new AssetsResource(this.http);
    this.offerings = new OfferingsResource(this.http);
    this.subscriptions = new SubscriptionsResource(this.http);
  }
}

export { ThirdFloorError } from './errors';
export { HttpClient } from './client';
export { InvestorsResource } from './resources/investors';
export { AssetsResource } from './resources/assets';
export { OfferingsResource } from './resources/offerings';
export { SubscriptionsResource } from './resources/subscriptions';
export * from './types';
