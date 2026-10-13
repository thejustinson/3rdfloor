import { Keypair } from '@solana/web3.js';
import type { HolderEntitlement } from '../types';
export interface DeployRwaToken2022MintOptions {
    /**
     * Solana RPC endpoint URL (defaults to `https://api.devnet.solana.com`).
     */
    rpcUrl?: string;
    /**
     * Treasury/issuer signer as a `@solana/web3.js` Keypair or Base58-encoded secret key string.
     */
    payer: Keypair | string;
    /**
     * Token name embedded in the SPL Token-2022 `MetadataPointer` extension.
     */
    name: string;
    /**
     * On-chain ticker symbol (e.g., `"MFR"`).
     */
    symbol: string;
    /**
     * Optional URI pointing to off-chain legal memorandum / metadata JSON.
     */
    uri?: string;
    /**
     * Token decimals (defaults to `0` for whole-unit RWA shares).
     */
    decimals?: number;
    /**
     * Initial supply to mint into the issuer's treasury Associated Token Account (ATA).
     */
    initialSupply?: number;
}
export interface DeployRwaToken2022MintResult {
    mintAddress: string;
    mintAuthority: string;
    freezeAuthority: string;
    treasuryAta: string | null;
    transactionSignature: string;
}
export interface SettleInvestorToken2022AtaOptions {
    /**
     * Solana RPC endpoint URL (defaults to `https://api.devnet.solana.com`).
     */
    rpcUrl?: string;
    /**
     * Treasury/issuer signer as a `@solana/web3.js` Keypair or Base58-encoded secret key string.
     */
    payer: Keypair | string;
    /**
     * Deployed SPL Token-2022 mint address.
     */
    mintAddress: string;
    /**
     * Whitelisted investor Solana Base58 wallet address.
     */
    investorWallet: string;
    /**
     * Token quantity to transfer/allocate.
     */
    amount: number;
    /**
     * Token decimals (defaults to `0`).
     */
    decimals?: number;
}
export interface SettleInvestorToken2022AtaResult {
    transactionSignature: string;
    destinationWallet: string;
    investorAta: string;
}
/**
 * Self-custody Solana primitive: Atomically deploys an SPL Token-2022 mint with
 * embedded `MetadataPointer` metadata and optionally mints the initial supply
 * into the issuer's treasury Associated Token Account (ATA).
 */
export declare function deployRwaToken2022Mint(options: DeployRwaToken2022MintOptions): Promise<DeployRwaToken2022MintResult>;
/**
 * Self-custody Solana primitive: Deterministically derives and provisions the
 * investor's SPL Token-2022 Associated Token Account (ATA) and transfers the
 * allocated RWA token units from the issuer treasury.
 */
export declare function settleInvestorToken2022Ata(options: SettleInvestorToken2022AtaOptions): Promise<SettleInvestorToken2022AtaResult>;
/**
 * Pure deterministic calculation engine for pro-rata USD yield distributions
 * across settled SPL Token-2022 holders.
 */
export declare function calculateProRataDistribution(totalAmountUsd: number, holders: {
    investorWallet: string;
    tokenBalance: number;
}[]): HolderEntitlement[];
//# sourceMappingURL=index.d.ts.map