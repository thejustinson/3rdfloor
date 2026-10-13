import { db } from '@/db';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ offeringId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  const { offeringId } = await params;
  const offeringIdNum = parseInt(offeringId, 10);
  if (isNaN(offeringIdNum)) {
    return apiError('INVALID_ID', 'Offering ID must be a valid integer.', 400);
  }

  try {
    const offering = await db.query.offerings.findFirst({
      where: (offerings, { and, eq }) =>
        and(
          eq(offerings.id, offeringIdNum),
          eq(offerings.organizationId, auth.organizationId)
        ),
      with: {
        tokens: true,
        subscriptions: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!offering) {
      return apiError(
        'NOT_FOUND',
        `Offering #${offeringIdNum} not found in this organization workspace.`,
        404
      );
    }

    const totalSupply = Number(offering.tokenSupply || 0);
    const settledSubs = (offering.subscriptions || []).filter(
      (s: any) => s.status === 'settled'
    );

    const totalAllocatedTokens = settledSubs.reduce(
      (sum: number, s: any) => sum + Number(s.tokenQuantity || 0),
      0
    );

    const holdings = settledSubs.map((sub: any) => {
      const tokenQty = Number(sub.tokenQuantity || 0);
      const ownershipPercentage =
        totalSupply > 0 ? Number(((tokenQty / totalSupply) * 100).toFixed(4)) : null;

      return {
        subscriptionId: sub.id,
        investorEmail: sub.user?.email || null,
        investorWallet: sub.investorWallet,
        tokenQuantity: tokenQty,
        ownershipPercentage,
        capitalSettledUsd: Number(sub.amountUsd || 0),
        transactionSignature: sub.transactionSignature,
        settledAt: sub.createdAt,
      };
    });

    const mappedHolders = holdings.map((h) => ({
      investorWallet: h.investorWallet || '',
      tokenBalance: h.tokenQuantity,
      ownershipPercentage: h.ownershipPercentage ?? 0,
      totalInvestedUsd: h.capitalSettledUsd,
      lastTransactionSignature: h.transactionSignature,
    }));

    return apiSuccess({
      offeringId: offering.id,
      offeringName: offering.name,
      tokenSymbol: offering.tokenSymbol,
      mintAddress: offering.tokens?.[0]?.mintAddress || null,
      totalSupply,
      allocatedTokens: totalAllocatedTokens,
      totalAllocatedTokens,
      holdersCount: holdings.length,
      holders: mappedHolders,
      holdings,
    });
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to fetch offering holdings',
      500
    );
  }
}
