'use server';

import { db } from '@/db';
import { organizations, memberships, users, assets, offerings, tokens, subscriptions, distributions, apiKeys, investors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createOrganization(formData: FormData, userId: string, userEmail: string) {
  const name = formData.get('name') as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        email: userEmail,
      });
    }

    const [newOrg] = await db.insert(organizations).values({
      name,
      slug,
    }).returning();

    await db.insert(memberships).values({
      userId,
      organizationId: newOrg.id,
      role: 'ADMIN',
    });

    revalidatePath('/dashboard');
    return { success: true, orgId: newOrg.id };
  } catch (error: any) {
    console.error('Failed to create organization:', error);
    return { success: false, error: error.message };
  }
}

export async function checkHasOrganization(userId: string) {
  try {
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, userId),
    });
    return !!membership;
  } catch (error) {
    console.error('Failed to check organization:', error);
    return false;
  }
}

export async function getDashboardStats(userId: string, orgId?: number) {
  try {
    let targetOrgIds: number[] = [];

    const userMemberships = await db.query.memberships.findMany({
      where: eq(memberships.userId, userId),
      with: {
        organization: true,
      },
    });

    if (orgId) {
      targetOrgIds = [orgId];
    } else {
      targetOrgIds = userMemberships.map(m => m.organizationId);
    }

    if (targetOrgIds.length === 0) return null;

    const orgAssets = await db.query.assets.findMany({
      where: (assets, { inArray }) => inArray(assets.organizationId, targetOrgIds),
    });

    const orgOfferings = await db.query.offerings.findMany({
      where: (offerings, { inArray }) => inArray(offerings.organizationId, targetOrgIds),
      with: {
        subscriptions: true,
        tokens: true,
      },
    });

    const orgInvestors = await db.query.investors.findMany({
      where: (investors, { inArray }) => inArray(investors.organizationId, targetOrgIds),
    });

    const activeOfferings = orgOfferings.filter(
      o => o.status === 'approved' || o.status === 'open'
    ).length;

    const allSettledSubs = orgOfferings.flatMap(o =>
      (o.subscriptions || []).filter((s: any) => s.status === 'settled')
    );

    const capitalRaised = allSettledSubs.reduce(
      (sum, s: any) => sum + Number(s.amountUsd || 0),
      0
    );

    const uniqueSubWallets = new Set(
      allSettledSubs.map((s: any) => (s.investorWallet || s.userId || '').toLowerCase())
    );
    for (const inv of orgInvestors) {
      if (inv.walletAddress) {
        uniqueSubWallets.add(inv.walletAddress.toLowerCase());
      } else {
        uniqueSubWallets.add(inv.email.toLowerCase());
      }
    }

    const orgWorkspaces = userMemberships
      .filter(m => m.organization)
      .map(m => {
        const oId = m.organization.id;
        const assetsCount = orgAssets.filter(a => a.organizationId === oId).length;
        const offeringsCount = orgOfferings.filter(o => o.organizationId === oId).length;
        const investorsCount = orgInvestors.filter(i => i.organizationId === oId).length;
        return {
          ...m.organization,
          role: m.role,
          assetsCount,
          offeringsCount,
          investorsCount,
        };
      });

    return {
      totalAssets: orgAssets.length,
      activeOfferings,
      capitalRaised,
      investors: uniqueSubWallets.size,
      registeredInvestorsCount: orgInvestors.length,
      orgWorkspaces,
      recentActivity: [],
      recentAssets: orgAssets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5),
      recentOfferings: orgOfferings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5),
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

export async function getUserOrganizations(userId: string) {
  try {
    const userMemberships = await db.query.memberships.findMany({
      where: eq(memberships.userId, userId),
      with: {
        organization: true,
      }
    });
    
    return userMemberships.map(m => m.organization);
  } catch (error) {
    console.error('Failed to fetch user organizations:', error);
    return [];
  }
}

export async function submitKyb(orgId: number, userId: string) {
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) => and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, orgId)
      )
    });

    if (!membership || membership.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized to submit KYB for this organization' };
    }

    await db.update(organizations)
      .set({ kybStatus: 'pending' })
      .where(eq(organizations.id, orgId));

    revalidatePath(`/org/${orgId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit KYB:', error);
    return { success: false, error: error.message };
  }
}

export async function createAsset(formData: FormData, orgId: number, userId: string) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const declaredValuation = formData.get('declaredValuation') as string;
  
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) => and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, orgId)
      )
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OPERATOR')) {
      return { success: false, error: 'Unauthorized to create assets for this organization' };
    }

    const [newAsset] = await db.insert(assets).values({
      organizationId: orgId,
      name,
      description,
      category,
      declaredValuation: declaredValuation || null,
      status: 'draft',
    }).returning();

    revalidatePath(`/org/${orgId}`);
    return { success: true, assetId: newAsset.id };
  } catch (error: any) {
    console.error('Failed to create asset:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrgAssets(orgId: number) {
  try {
    const orgAssets = await db.query.assets.findMany({
      where: eq(assets.organizationId, orgId),
      orderBy: (assets, { desc }) => [desc(assets.createdAt)]
    });
    return orgAssets;
  } catch (error) {
    console.error('Failed to fetch org assets:', error);
    return [];
  }
}

export async function getOrgOfferings(orgId: number) {
  try {
    const orgOfferings = await db.query.offerings.findMany({
      where: eq(offerings.organizationId, orgId),
      with: {
        asset: true
      },
      orderBy: (offerings, { desc }) => [desc(offerings.createdAt)]
    });
    return orgOfferings;
  } catch (error) {
    console.error('Failed to fetch org offerings:', error);
    return [];
  }
}

export async function createOffering(formData: FormData, orgId: number, userId: string) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const assetId = parseInt(formData.get('assetId') as string);
  const targetRaise = formData.get('targetRaise') as string;
  const tokenName = formData.get('tokenName') as string;
  const tokenSymbol = formData.get('tokenSymbol') as string;
  const tokenStandard = formData.get('tokenStandard') as string;
  const tokenSupply = formData.get('tokenSupply') as string;
  const tokenPrice = formData.get('tokenPrice') as string;
  
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) => and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, orgId)
      )
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OPERATOR')) {
      return { success: false, error: 'Unauthorized to create offerings for this organization' };
    }

    const [newOffering] = await db.insert(offerings).values({
      organizationId: orgId,
      assetId,
      name,
      description,
      tokenName: tokenName || null,
      tokenSymbol: tokenSymbol || null,
      tokenStandard: tokenStandard || 'Token-2022',
      targetRaise: targetRaise || null,
      tokenSupply: tokenSupply || null,
      tokenPrice: tokenPrice || null,
      status: 'draft',
    }).returning();

    revalidatePath(`/org/${orgId}`);
    return { success: true, offeringId: newOffering.id };
  } catch (error: any) {
    console.error('Failed to create offering:', error);
    return { success: false, error: error.message };
  }
}

export async function getAsset(assetId: number, orgId: number) {
  try {
    const asset = await db.query.assets.findFirst({
      where: (assets, { and, eq }) => and(
        eq(assets.id, assetId),
        eq(assets.organizationId, orgId)
      )
    });
    return asset || null;
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    return null;
  }
}

export async function getOffering(offeringId: number, orgId: number) {
  try {
    const offering = await db.query.offerings.findFirst({
      where: (offerings, { and, eq }) => and(
        eq(offerings.id, offeringId),
        eq(offerings.organizationId, orgId)
      ),
      with: {
        asset: true,
        tokens: true,
        subscriptions: {
          with: {
            user: true,
          },
          orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
        },
        distributions: {
          orderBy: (distributions, { desc }) => [desc(distributions.createdAt)],
        },
      }
    });
    return offering || null;
  } catch (error) {
    console.error('Failed to fetch offering:', error);
    return null;
  }
}

export async function getExploreOfferings() {
  try {
    const results = await db.query.offerings.findMany({
      with: {
        asset: true,
        organization: true,
        tokens: true,
        subscriptions: true,
      },
      orderBy: (offerings, { desc }) => [desc(offerings.createdAt)],
    });
    return results;
  } catch (error) {
    console.error('Failed to fetch explore offerings:', error);
    return [];
  }
}

export async function getExploreOffering(offeringId: number) {
  try {
    const offering = await db.query.offerings.findFirst({
      where: eq(offerings.id, offeringId),
      with: {
        asset: true,
        organization: true,
        tokens: true,
        subscriptions: true,
        distributions: {
          orderBy: (distributions, { desc }) => [desc(distributions.createdAt)],
        },
      },
    });
    return offering || null;
  } catch (error) {
    console.error('Failed to fetch explore offering:', error);
    return null;
  }
}

export async function createSubscription(
  offeringId: number,
  userId: string,
  investorWallet: string,
  amountUsd: string,
  tokenQuantity: string,
  userEmail?: string
) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        email: userEmail || `wallet:${investorWallet}`,
      });
    }

    const [sub] = await db.insert(subscriptions).values({
      offeringId,
      userId,
      investorWallet,
      amountUsd,
      tokenQuantity,
      status: 'pending',
    }).returning();

    revalidatePath(`/explore/${offeringId}`);
    revalidatePath('/portfolio');
    return { success: true, subscriptionId: sub.id };
  } catch (error: any) {
    console.error('Failed to create subscription:', error);
    return { success: false, error: error.message };
  }
}

export async function settleSubscription(subscriptionId: number) {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: {
        offering: {
          with: {
            tokens: true,
          },
        },
      },
    });

    if (!sub) {
      return { success: false, error: 'Subscription not found' };
    }

    if (sub.status === 'settled') {
      return { success: true, transactionSignature: sub.transactionSignature };
    }

    const tokenRecord = sub.offering?.tokens?.[0];
    if (!tokenRecord?.mintAddress) {
      return {
        success: false,
        error: 'Offering does not have a deployed Solana token mint yet. Approve the offering first.',
      };
    }

    const qty = Math.max(1, Math.floor(Number(sub.tokenQuantity || 1)));
    const walletTarget = sub.investorWallet || sub.userId;

    const { allocateTokensToInvestor } = await import('@/lib/solana');
    const { transactionSignature, destinationWallet } = await allocateTokensToInvestor(
      tokenRecord.mintAddress,
      walletTarget,
      qty,
      tokenRecord.decimals || 0
    );

    await db
      .update(subscriptions)
      .set({
        status: 'settled',
        transactionSignature,
        investorWallet: destinationWallet,
      })
      .where(eq(subscriptions.id, subscriptionId));

    if (sub.offering?.organizationId) {
      revalidatePath(`/org/${sub.offering.organizationId}`);
      revalidatePath(`/org/${sub.offering.organizationId}/investors`);
      revalidatePath(`/org/${sub.offering.organizationId}/offerings/${sub.offeringId}`);
    }
    revalidatePath('/portfolio');
    revalidatePath(`/explore/${sub.offeringId}`);

    return { success: true, transactionSignature };
  } catch (error: any) {
    console.error('Failed to settle subscription:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectSubscription(subscriptionId: number) {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: {
        offering: true,
      },
    });

    if (!sub) {
      return { success: false, error: 'Subscription not found' };
    }

    await db
      .update(subscriptions)
      .set({ status: 'rejected' })
      .where(eq(subscriptions.id, subscriptionId));

    if (sub.offering?.organizationId) {
      revalidatePath(`/org/${sub.offering.organizationId}/investors`);
      revalidatePath(`/org/${sub.offering.organizationId}/offerings/${sub.offeringId}`);
    }
    revalidatePath('/portfolio');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject subscription:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrgInvestorsData(orgId: number) {
  try {
    const orgOfferings = await db.query.offerings.findMany({
      where: eq(offerings.organizationId, orgId),
      with: {
        tokens: true,
        subscriptions: {
          with: {
            user: true,
          },
          orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
        },
        distributions: {
          orderBy: (distributions, { desc }) => [desc(distributions.createdAt)],
        },
      },
      orderBy: (offerings, { desc }) => [desc(offerings.createdAt)],
    });

    return orgOfferings;
  } catch (error) {
    console.error('Failed to fetch org investors data:', error);
    return [];
  }
}

export async function getUserPortfolio(userId: string) {
  try {
    const userSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
      with: {
        offering: {
          with: {
            asset: true,
            organization: true,
            tokens: true,
            distributions: {
              orderBy: (distributions, { desc }) => [desc(distributions.createdAt)],
            },
          },
        },
      },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    return userSubs;
  } catch (error) {
    console.error('Failed to fetch user portfolio:', error);
    return [];
  }
}

export async function createDistribution(
  offeringId: number,
  orgId: number,
  title: string,
  totalAmountUsd: string
) {
  try {
    const [dist] = await db
      .insert(distributions)
      .values({
        offeringId,
        title,
        totalAmountUsd,
        status: 'executed',
      })
      .returning();

    revalidatePath(`/org/${orgId}/offerings/${offeringId}`);
    revalidatePath(`/org/${orgId}/investors`);
    revalidatePath('/portfolio');

    return { success: true, distributionId: dist.id };
  } catch (error: any) {
    console.error('Failed to create distribution:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOfferingLifecycleStatus(
  offeringId: number,
  orgId: number,
  newStatus: 'open' | 'paused' | 'closed' | 'approved'
) {
  try {
    await db
      .update(offerings)
      .set({ status: newStatus })
      .where(eq(offerings.id, offeringId));

    revalidatePath(`/org/${orgId}/offerings/${offeringId}`);
    revalidatePath(`/org/${orgId}/offerings`);
    revalidatePath('/explore');
    revalidatePath(`/explore/${offeringId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update offering status:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrgApiKeys(orgId: number, userId: string) {
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) =>
        and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)),
    });

    if (!membership) {
      return [];
    }

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.organizationId, orgId),
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });

    // Never return the raw hash to the client UI
    return keys.map(({ keyHash, ...safeKey }) => safeKey);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return [];
  }
}

export async function createOrgApiKey(orgId: number, userId: string, name: string) {
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) =>
        and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)),
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OPERATOR')) {
      return { success: false, error: 'Unauthorized to create API keys for this organization' };
    }

    const { generateApiKeyPair } = await import('@/lib/api-auth');
    const { rawKey, keyPrefix, keyHash } = generateApiKeyPair();

    const [created] = await db
      .insert(apiKeys)
      .values({
        organizationId: orgId,
        name: name.trim(),
        keyPrefix,
        keyHash,
        status: 'active',
      })
      .returning();

    revalidatePath(`/org/${orgId}/developers`);

    return {
      success: true,
      rawKey,
      keyRecord: {
        id: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
        status: created.status,
        createdAt: created.createdAt,
      },
    };
  } catch (error: any) {
    console.error('Failed to create API key:', error);
    return { success: false, error: error.message };
  }
}

export async function revokeOrgApiKey(keyId: number, orgId: number, userId: string) {
  try {
    const membership = await db.query.memberships.findFirst({
      where: (memberships, { and, eq }) =>
        and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)),
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OPERATOR')) {
      return { success: false, error: 'Unauthorized to revoke API keys for this organization' };
    }

    await db
      .update(apiKeys)
      .set({
        status: 'revoked',
        revokedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));

    revalidatePath(`/org/${orgId}/developers`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to revoke API key:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrgInvestorProfiles(orgId: number) {
  try {
    const records = await db.query.investors.findMany({
      where: eq(investors.organizationId, orgId),
      orderBy: (investors, { desc }) => [desc(investors.createdAt)],
    });
    return records;
  } catch (error) {
    console.error('Failed to fetch org investor profiles:', error);
    return [];
  }
}

export async function createInvestorProfile(
  orgId: number,
  data: {
    name: string;
    email: string;
    walletAddress?: string;
    investorType?: string;
    jurisdiction?: string;
    kycStatus?: string;
  }
) {
  try {
    const [created] = await db
      .insert(investors)
      .values({
        organizationId: orgId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        walletAddress: data.walletAddress?.trim() || null,
        investorType: data.investorType || 'accredited',
        jurisdiction: (data.jurisdiction || 'US').toUpperCase(),
        kycStatus: data.kycStatus || 'pending',
      })
      .returning();

    revalidatePath(`/org/${orgId}/investors`);
    revalidatePath(`/org/${orgId}`);
    return { success: true, investor: created };
  } catch (error: any) {
    console.error('Failed to create investor profile:', error);
    return { success: false, error: error.message };
  }
}

export async function updateInvestorKycStatus(
  investorId: number,
  orgId: number,
  kycStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
) {
  try {
    await db
      .update(investors)
      .set({ kycStatus })
      .where(eq(investors.id, investorId));

    revalidatePath(`/org/${orgId}/investors`);
    revalidatePath(`/org/${orgId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update investor KYC status:', error);
    return { success: false, error: error.message };
  }
}
