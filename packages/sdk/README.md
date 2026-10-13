# `@3rdfloor/sdk`

Official TypeScript / Node.js SDK and Solana SPL Token-2022 primitives for **3rdfloor** — Programmable Real-World Asset (RWA) Tokenization Infrastructure.

## Installation

```bash
npm install @3rdfloor/sdk
```

---

## 1. Managed Cloud SDK (`@3rdfloor/sdk`)

Use your workspace secret key (`3f_live_...` generated under `/org/[id]/developers`) to interact with your organization's RWA catalog, Investor & KYC Registry, SPL Token-2022 offerings, and on-chain settlement engine:

```ts
import { ThirdFloor } from '@3rdfloor/sdk';

const rwa = new ThirdFloor({
  apiKey: process.env.THREEFLOOR_SECRET_KEY!,
  baseUrl: 'http://localhost:3000/api/v1',
});

// 1. Register an underlying Real-World Asset
const asset = await rwa.assets.create({
  name: 'Mayfair Commercial Plaza',
  category: 'Real Estate',
  declaredValuation: 4_500_000,
  currency: 'USD',
});

// 2. Configure an Offering & deploy the Solana SPL Token-2022 mint
const offering = await rwa.offerings.create({
  assetId: asset.id,
  name: 'Mayfair Plaza Series A',
  targetRaise: 4_500_000,
  tokenName: 'Mayfair RWA Token',
  tokenSymbol: 'MFR',
  tokenSupply: 450_000,
  tokenPrice: 10,
});

const deployment = await rwa.offerings.deployToken(offering.id);

// 3. Onboard an Investor & approve KYC + whitelist their Solana wallet
const investor = await rwa.investors.create({
  name: 'Apex Institutional Partners LP',
  email: 'treasury@apex-lp.io',
  investorType: 'institutional',
  jurisdiction: 'US',
});

const kyc = await rwa.investors.verifyKyc(investor.id, {
  kycStatus: 'approved',
  investorType: 'qualified_purchaser',
  walletAddress: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
  provider: 'sumsub',
  referenceId: 'inq_98a7b6c5d4e3',
});

// 4. Record Subscription & settle SPL Token-2022 to the Investor's ATA
const sub = await rwa.subscriptions.create(offering.id, {
  investorWallet: kyc.walletAddress!,
  amountUsd: 5_000,
});

const settled = await rwa.subscriptions.settle(sub.id);
console.log('Settled on Solana:', settled.solanaExplorerUrl);
```

---

## 2. Self-Custody Solana Token-2022 Mode (`@3rdfloor/sdk/solana`)

For institutional teams that want to sign SPL Token-2022 RWA transactions directly with their own keypair/KMS against a custom Solana RPC endpoint:

```ts
import {
  deployRwaToken2022Mint,
  settleInvestorToken2022Ata,
  calculateProRataDistribution,
} from '@3rdfloor/sdk/solana';

const mint = await deployRwaToken2022Mint({
  rpcUrl: 'https://api.devnet.solana.com',
  payer: process.env.SOLANA_PAYER_KEY!,
  name: 'Mayfair RWA Token',
  symbol: 'MFR',
  initialSupply: 450_000,
});

const transfer = await settleInvestorToken2022Ata({
  rpcUrl: 'https://api.devnet.solana.com',
  payer: process.env.SOLANA_PAYER_KEY!,
  mintAddress: mint.mintAddress,
  investorWallet: 'GF1YRBkxQNrN2T9nojHdLEy7v4TgFH38T6j4sMbaAipX',
  amount: 500,
});
```
