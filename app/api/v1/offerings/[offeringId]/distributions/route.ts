import { db } from '@/db';
import { distributions } from '@/db/schema';
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
        distributions: {
          orderBy: (distributions, { desc }) => [desc(distributions.createdAt)],
        },
        subscriptions: true,
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

    const enrichedDistributions = (offering.distributions || []).map((dist: any) => {
      const poolUsd = Number(dist.totalAmountUsd || 0);
      const entitlements = settledSubs.map((sub: any) => {
        const qty = Number(sub.tokenQuantity || 0);
        const shareRatio = totalSupply > 0 ? qty / totalSupply : 0;
        return {
          investorWallet: sub.investorWallet,
          tokenQuantity: qty,
          sharePercentage: Number((shareRatio * 100).toFixed(4)),
          payoutAmountUsd: Number((poolUsd * shareRatio).toFixed(2)),
        };
      });

      return {
        ...dist,
        entitlements,
      };
    });

    return apiSuccess(enrichedDistributions);
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to fetch distributions',
      500
    );
  }
}

export async function POST(
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
        subscriptions: true,
      },
    });

    if (!offering) {
      return apiError(
        'NOT_FOUND',
        `Offering #${offeringIdNum} not found in this organization workspace.`,
        404
      );
    }

    const body = await req.json();
    const { title, totalAmountUsd } = body;

    if (!title || !totalAmountUsd || Number(totalAmountUsd) <= 0) {
      return apiError(
        'VALIDATION_ERROR',
        'Fields "title" and a positive "totalAmountUsd" are required.',
        422
      );
    }

    const [createdDist] = await db
      .insert(distributions)
      .values({
        offeringId: offeringIdNum,
        title: String(title).trim(),
        totalAmountUsd: String(totalAmountUsd),
        status: 'executed',
      })
      .returning();

    const totalSupply = Number(offering.tokenSupply || 0);
    const poolUsd = Number(totalAmountUsd);
    const settledSubs = (offering.subscriptions || []).filter(
      (s: any) => s.status === 'settled'
    );

    const entitlements = settledSubs.map((sub: any) => {
      const qty = Number(sub.tokenQuantity || 0);
      const shareRatio = totalSupply > 0 ? qty / totalSupply : 0;
      return {
        investorWallet: sub.investorWallet,
        tokenQuantity: qty,
        sharePercentage: Number((shareRatio * 100).toFixed(4)),
        payoutAmountUsd: Number((poolUsd * shareRatio).toFixed(2)),
      };
    });

    return apiSuccess(
      {
        distribution: createdDist,
        entitlements,
      },
      201
    );
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to execute distribution',
      500
    );
  }
}
