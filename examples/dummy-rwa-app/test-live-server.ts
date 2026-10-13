/**
 * Live test script for @3rdfloor/sdk
 * Run this while the Next.js server is active (`npm run dev`)
 * Usage:
 *   $env:THREEFLOOR_SECRET_KEY="3f_live_..."
 *   npm run test:live
 */

import { ThirdFloor } from '@3rdfloor/sdk';

const apiKey = process.env.THREEFLOOR_SECRET_KEY || '3f_live_test_key';
const baseUrl = process.env.THREEFLOOR_API_URL || 'http://localhost:3000/api/v1';

console.log(`Connecting to 3rdfloor API at: ${baseUrl}`);
const rwa = new ThirdFloor({ apiKey, baseUrl });

async function main() {
  console.log('\n1. Querying workspace investors...');
  try {
    const investors = await rwa.investors.list();
    console.log(`   Found ${investors.length} investor(s).`);
  } catch (err: any) {
    console.log(`   (API returned: ${err.message})`);
  }

  console.log('\n2. Querying registered real-world assets...');
  try {
    const assets = await rwa.assets.list();
    console.log(`   Found ${assets.length} asset(s).`);
  } catch (err: any) {
    console.log(`   (API returned: ${err.message})`);
  }

  console.log('\n3. Querying active offerings...');
  try {
    const offerings = await rwa.offerings.list();
    console.log(`   Found ${offerings.length} offering(s).`);
  } catch (err: any) {
    console.log(`   (API returned: ${err.message})`);
  }
}

main().catch(console.error);
