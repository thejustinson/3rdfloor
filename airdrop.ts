import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from 'dotenv';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

config({ path: '.env.local' });

async function run() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const payerKeyStr = process.env.SOLANA_PAYER_KEY;
  if (!payerKeyStr) throw new Error('No SOLANA_PAYER_KEY');

  // We can just use the public key string if we recorded it, or decode the private key
  const payer = Keypair.fromSecretKey(bs58.decode(payerKeyStr));
  const pubkey = payer.publicKey;

  console.log('Requesting airdrop for:', pubkey.toBase58());
  
  const signature = await connection.requestAirdrop(pubkey, 0.1 * LAMPORTS_PER_SOL);
  
  console.log('Airdrop transaction submitted:', signature);
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature
  });

  const balance = await connection.getBalance(pubkey);
  console.log('New balance:', balance / LAMPORTS_PER_SOL, 'SOL');
}

run().catch(console.error);
