import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';

const kp = Keypair.generate();
const secret = bs58.encode(kp.secretKey);
fs.appendFileSync('.env.local', `\nSOLANA_PAYER_KEY=${secret}\n`);
console.log('Added SOLANA_PAYER_KEY to .env.local:', kp.publicKey.toBase58());
