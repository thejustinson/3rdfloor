import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
} from '@solana/spl-token';
import {
  type TokenMetadata,
  createInitializeInstruction,
  pack,
} from '@solana/spl-token-metadata';
import bs58 from 'bs58';
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

function resolveKeypair(payer: Keypair | string): Keypair {
  if (typeof payer === 'string') {
    return Keypair.fromSecretKey(bs58.decode(payer.trim()));
  }
  return payer;
}

/**
 * Self-custody Solana primitive: Atomically deploys an SPL Token-2022 mint with
 * embedded `MetadataPointer` metadata and optionally mints the initial supply
 * into the issuer's treasury Associated Token Account (ATA).
 */
export async function deployRwaToken2022Mint(
  options: DeployRwaToken2022MintOptions
): Promise<DeployRwaToken2022MintResult> {
  const connection = new Connection(
    options.rpcUrl || 'https://api.devnet.solana.com',
    'confirmed'
  );
  const payer = resolveKeypair(options.payer);
  const mint = Keypair.generate();
  const decimals = options.decimals ?? 0;
  const supply = options.initialSupply ?? 0;

  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: options.name,
    symbol: options.symbol,
    uri: options.uri || '',
    additionalMetadata: [],
  };

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataLen + 128
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint.publicKey,
      payer.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint.publicKey,
      updateAuthority: payer.publicKey,
      mint: mint.publicKey,
      mintAuthority: payer.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
    })
  );

  let treasuryAtaAddress: string | null = null;

  if (supply > 0) {
    const ata = getAssociatedTokenAddressSync(
      mint.publicKey,
      payer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    treasuryAtaAddress = ata.toBase58();

    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        payer.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createMintToInstruction(
        mint.publicKey,
        ata,
        payer.publicKey,
        supply,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const signature = await sendAndConfirmTransaction(connection, tx, [
    payer,
    mint,
  ]);

  return {
    mintAddress: mint.publicKey.toBase58(),
    mintAuthority: payer.publicKey.toBase58(),
    freezeAuthority: payer.publicKey.toBase58(),
    treasuryAta: treasuryAtaAddress,
    transactionSignature: signature,
  };
}

/**
 * Self-custody Solana primitive: Deterministically derives and provisions the
 * investor's SPL Token-2022 Associated Token Account (ATA) and transfers the
 * allocated RWA token units from the issuer treasury.
 */
export async function settleInvestorToken2022Ata(
  options: SettleInvestorToken2022AtaOptions
): Promise<SettleInvestorToken2022AtaResult> {
  const connection = new Connection(
    options.rpcUrl || 'https://api.devnet.solana.com',
    'confirmed'
  );
  const payer = resolveKeypair(options.payer);
  const mintPubkey = new PublicKey(options.mintAddress);
  const decimals = options.decimals ?? 0;

  let investorPubkey: PublicKey;
  try {
    investorPubkey = new PublicKey(options.investorWallet.trim());
  } catch {
    const seed = new Uint8Array(32);
    const encoded = new TextEncoder().encode(options.investorWallet);
    seed.set(encoded.slice(0, 32));
    investorPubkey = Keypair.fromSeed(seed).publicKey;
  }

  const investorAta = getAssociatedTokenAddressSync(
    mintPubkey,
    investorPubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const tx = new Transaction();
  const investorAtaInfo = await connection.getAccountInfo(investorAta);
  if (!investorAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        investorAta,
        investorPubkey,
        mintPubkey,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const treasuryAta = getAssociatedTokenAddressSync(
    mintPubkey,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  let useTransfer = false;
  try {
    const balanceRes = await connection.getTokenAccountBalance(treasuryAta);
    if (Number(balanceRes.value.amount) >= options.amount) {
      useTransfer = true;
    }
  } catch {
    useTransfer = false;
  }

  if (useTransfer) {
    tx.add(
      createTransferCheckedInstruction(
        treasuryAta,
        mintPubkey,
        investorAta,
        payer.publicKey,
        options.amount,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
  } else {
    tx.add(
      createMintToInstruction(
        mintPubkey,
        investorAta,
        payer.publicKey,
        options.amount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const signature = await sendAndConfirmTransaction(connection, tx, [payer]);

  return {
    transactionSignature: signature,
    destinationWallet: investorPubkey.toBase58(),
    investorAta: investorAta.toBase58(),
  };
}

/**
 * Pure deterministic calculation engine for pro-rata USD yield distributions
 * across settled SPL Token-2022 holders.
 */
export function calculateProRataDistribution(
  totalAmountUsd: number,
  holders: { investorWallet: string; tokenBalance: number }[]
): HolderEntitlement[] {
  const totalTokens = holders.reduce(
    (sum, h) => sum + Math.max(0, Number(h.tokenBalance || 0)),
    0
  );

  if (totalTokens <= 0 || totalAmountUsd <= 0) {
    return [];
  }

  return holders.map((h) => {
    const qty = Math.max(0, Number(h.tokenBalance || 0));
    const ratio = qty / totalTokens;
    return {
      investorWallet: h.investorWallet,
      tokenQuantity: qty,
      sharePercentage: Number((ratio * 100).toFixed(4)),
      payoutAmountUsd: Number((totalAmountUsd * ratio).toFixed(2)),
    };
  });
}
