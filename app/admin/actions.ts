'use server';

import { db } from '@/db';
import { organizations, assets, offerings, tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPendingApprovals() {
  try {
    const pendingOrgs = await db.query.organizations.findMany({
      where: eq(organizations.kybStatus, 'pending'),
    });

    const pendingAssets = await db.query.assets.findMany({
      where: eq(assets.status, 'under_review'), // We will also fetch drafts just for this demo
      with: { organization: true }
    });

    const draftAssets = await db.query.assets.findMany({
      where: eq(assets.status, 'draft'),
      with: { organization: true }
    });

    const pendingOfferings = await db.query.offerings.findMany({
      where: eq(offerings.status, 'under_review'),
      with: { organization: true, asset: true }
    });

    const draftOfferings = await db.query.offerings.findMany({
      where: eq(offerings.status, 'draft'),
      with: { organization: true, asset: true }
    });

    return {
      orgs: pendingOrgs,
      assets: [...pendingAssets, ...draftAssets], // Combining for demo purposes so admin can approve drafts
      offerings: [...pendingOfferings, ...draftOfferings],
    };
  } catch (error) {
    console.error('Failed to fetch pending approvals:', error);
    return { orgs: [], assets: [], offerings: [] };
  }
}

export async function approveOrg(orgId: number) {
  try {
    await db.update(organizations).set({ kybStatus: 'approved' }).where(eq(organizations.id, orgId));
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveAsset(assetId: number) {
  try {
    await db.update(assets).set({ status: 'approved' }).where(eq(assets.id, assetId));
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveOffering(offeringId: number) {
  try {
    const offering = await db.query.offerings.findFirst({
      where: eq(offerings.id, offeringId)
    });

    if (!offering) {
      throw new Error('Offering not found');
    }

    // Only deploy if it hasn't been deployed yet (for safety)
    const existingToken = await db.query.tokens.findFirst({
      where: eq(tokens.offeringId, offeringId)
    });

    if (!existingToken) {
      const { createTokenMint } = await import('@/lib/solana');
      
      const mintName = offering.tokenName || offering.name;
      // Create a basic symbol from the offering name if not provided (e.g., "Real Estate Fund" -> "REF")
      const mintSymbol = offering.tokenSymbol || offering.name.split(' ').map((w: string) => w[0]).join('').substring(0, 4).toUpperCase();
      const mintSupply = offering.tokenSupply ? parseInt(offering.tokenSupply) : 0;
      
      const { mintAddress, mintAuthority, freezeAuthority, transactionSignature } = await createTokenMint(0, mintName, mintSymbol, "https://3rdfloor.app", mintSupply); // 0 decimals for RWA tokens typically

      await db.insert(tokens).values({
        offeringId,
        mintAddress,
        decimals: 0,
        initialSupply: mintSupply ? mintSupply.toString() : null,
        mintAuthority,
        freezeAuthority,
        transactionSignature,
        status: 'confirmed',
      });
    }

    await db.update(offerings).set({ status: 'approved' }).where(eq(offerings.id, offeringId));
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to approve offering:', error);
    return { success: false, error: error.message };
  }
}
