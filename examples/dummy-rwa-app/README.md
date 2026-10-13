# Dummy RWA App (`examples/dummy-rwa-app`)

A test and demonstration project consuming **`@3rdfloor/sdk`**.

## Running the SDK Test Suite

Run the automated test script with `tsx`:

```bash
npm run test:sdk
```

This verifies:
1. `ThirdFloor` constructor parameter validation (`MISSING_API_KEY` handling).
2. All typed resource namespaces:
   - `rwa.assets.create(...)`
   - `rwa.offerings.create(...)`
   - `rwa.offerings.deployToken(...)`
   - `rwa.investors.create(...)`
   - `rwa.investors.verifyKyc(...)`
   - `rwa.subscriptions.create(...)`
   - `rwa.subscriptions.settle(...)`
3. Self-custody Solana SPL Token-2022 yield distribution calculation via `@3rdfloor/sdk/solana`.

## Running Against a Live Server

Start your Next.js server in the main repo:
```bash
npm run dev
```

Then in this directory, provide your secret key and run:
```bash
$env:THREEFLOOR_SECRET_KEY="3f_live_..."
npm run test:live
```
