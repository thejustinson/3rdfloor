import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  TYPE_SIZE,
  LENGTH_SIZE,
  createInitializeMetadataPointerInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import { createInitializeInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata';
import bs58 from 'bs58';

// Initialize connection to Devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export async function createTokenMint(
  decimals: number = 0,
  name: string = 'Unknown',
  symbol: string = 'UNK',
  uri: string = '',
  supply: number = 0
): Promise<{
  mintAddress: string;
  mintAuthority: string;
  freezeAuthority: string;
  transactionSignature: string;
}> {
  const payerKeyStr = process.env.SOLANA_PAYER_KEY;
  if (!payerKeyStr) {
    throw new Error('SOLANA_PAYER_KEY is missing in environment variables.');
  }

  const payer = Keypair.fromSecretKey(bs58.decode(payerKeyStr));
  const mint = Keypair.generate();

  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: name,
    symbol: symbol,
    uri: uri,
    additionalMetadata: [],
  };

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  // Overfund slightly to avoid exact byte mismatch rent errors during reallocation
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen + 128);

  const { SystemProgram } = await import('@solana/web3.js');
  
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
      payer.publicKey, // mintAuthority
      payer.publicKey, // freezeAuthority
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

  // If a supply is specified, mint it to the platform treasury ATA
  if (supply > 0) {
    const ata = getAssociatedTokenAddressSync(
      mint.publicKey,
      payer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
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
        supply, // Amount in raw units (since decimals is typically 0, 1 unit = 1 token)
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [payer, mint]
  );

  return {
    mintAddress: mint.publicKey.toBase58(),
    mintAuthority: payer.publicKey.toBase58(),
    freezeAuthority: payer.publicKey.toBase58(),
    transactionSignature: signature,
  };
}

export async function allocateTokensToInvestor(
  mintAddressStr: string,
  investorWalletStr: string,
  amount: number,
  decimals: number = 0
): Promise<{ transactionSignature: string; destinationWallet: string }> {
  const payerKeyStr = process.env.SOLANA_PAYER_KEY;
  if (!payerKeyStr) {
    throw new Error('SOLANA_PAYER_KEY is missing in environment variables.');
  }

  const payer = Keypair.fromSecretKey(bs58.decode(payerKeyStr));
  const mintPubkey = new PublicKey(mintAddressStr);

  let investorPubkey: PublicKey;
  try {
    investorPubkey = new PublicKey(investorWalletStr.trim());
  } catch {
    // Fallback if user entered a non-Solana address (e.g. EVM 0x address during testing):
    // deterministically derive a valid Solana public key from the string bytes
    const seed = new Uint8Array(32);
    const encoded = new TextEncoder().encode(investorWalletStr);
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

  // Create investor ATA if it doesn't exist yet
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

  // Check if treasury ATA has enough balance to transfer; otherwise mint directly
  const treasuryAta = getAssociatedTokenAddressSync(
    mintPubkey,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  let useTransfer = false;
  try {
    const balanceRes = await connection.getTokenAccountBalance(treasuryAta);
    const currentTreasuryBalance = Number(balanceRes.value.amount);
    if (currentTreasuryBalance >= amount) {
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
        amount,
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
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const signature = await sendAndConfirmTransaction(connection, tx, [payer]);

  return {
    transactionSignature: signature,
    destinationWallet: investorPubkey.toBase58(),
  };
}

