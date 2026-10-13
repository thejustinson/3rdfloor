import { NextRequest } from 'next/server';
import { db } from '@/db';
import { investors, offerings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

/**
 * GET /api/v1/investors
 * Lists all registered investors in the authenticated organization workspace,
 * enriched with their aggregated subscription & settled token metrics.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) return apiError(auth.code, auth.message, auth.status);

  try {
    const orgInvestors = await db.query.investors.findMany({
      where: eq(investors.organizationId, auth.organizationId),
      orderBy: (investors, { desc }) => [desc(investors.createdAt)],
    });

    const orgOfferings = await db.query.offerings.findMany({
      where: eq(offerings.organizationId, auth.organizationId),
      with: {
        subscriptions: {
          with: {
            user: true,
          },
        },
      },
    });

    const allSubs = orgOfferings.flatMap((o) =>
      (o.subscriptions || []).map((s: any) => ({
        ...s,
        offeringName: o.name,
        tokenSymbol: o.tokenSymbol,
      }))
    );

    const enriched = orgInvestors.map((inv) => {
      const matchingSubs = allSubs.filter(
        (s) =>
          (inv.walletAddress && s.investorWallet === inv.walletAddress) ||
          (s.user?.email && s.user.email.toLowerCase() === inv.email.toLowerCase())
      );

      const settledSubs = matchingSubs.filter((s) => s.status === 'settled');
      const totalCommittedUsd = settledSubs.reduce(
        (sum, s) => sum + Number(s.amountUsd || 0),
        0
      );
      const totalTokensHeld = settledSubs.reduce(
        (sum, s) => sum + Number(s.tokenQuantity || 0),
        0
      );

      return {
        ...inv,
        metrics: {
          subscriptionsCount: matchingSubs.length,
          settledSubscriptionsCount: settledSubs.length,
          totalCapitalSettledUsd: totalCommittedUsd,
          totalTokensHeld,
        },
      };
    });

    return apiSuccess(enriched);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to list investors.', 500);
  }
}

/**
 * POST /api/v1/investors
 * Onboards/registers an investor profile inside the authenticated organization workspace.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) return apiError(auth.code, auth.message, auth.status);

  try {
    const body = await req.json();
    const {
      name,
      email,
      walletAddress,
      investorType,
      jurisdiction,
      kycStatus,
    } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return apiError('VALIDATION_ERROR', 'Field "name" is required.', 400);
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return apiError('VALIDATION_ERROR', 'Field "email" is required.', 400);
    }

    const validTypes = [
      'individual',
      'accredited',
      'institutional',
      'qualified_purchaser',
    ];
    const resolvedType =
      investorType && validTypes.includes(investorType)
        ? investorType
        : 'accredited';

    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    const resolvedStatus =
      kycStatus && validStatuses.includes(kycStatus) ? kycStatus : 'pending';

    // Ensure a corresponding user record exists for seamless subscription linking
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email: normalizedEmail,
        name: name.trim(),
      });
    }

    const [created] = await db
      .insert(investors)
      .values({
        organizationId: auth.organizationId,
        name: name.trim(),
        email: normalizedEmail,
        walletAddress: walletAddress ? String(walletAddress).trim() : null,
        investorType: resolvedType,
        jurisdiction: jurisdiction ? String(jurisdiction).trim().toUpperCase() : 'US',
        kycStatus: resolvedStatus,
      })
      .returning();

    return apiSuccess(created, 201);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to create investor.', 500);
  }
}
