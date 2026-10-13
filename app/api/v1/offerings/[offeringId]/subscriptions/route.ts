import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    });

    if (!offering) {
      return apiError(
        'NOT_FOUND',
        `Offering #${offeringIdNum} not found in this organization workspace.`,
        404
      );
    }

    const subs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.offeringId, offeringIdNum),
      with: {
        user: true,
      },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    return apiSuccess(subs);
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to fetch subscriptions',
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

    if (offering.status === 'closed') {
      return apiError(
        'OFFERING_CLOSED',
        'This offering is closed and no longer accepts subscriptions.',
        409
      );
    }

    const body = await req.json();
    const { investorWallet, amountUsd, tokenQuantity, investorEmail, userId } = body;

    if (!investorWallet || !amountUsd) {
      return apiError(
        'VALIDATION_ERROR',
        'Fields "investorWallet" and "amountUsd" are required.',
        422
      );
    }

    const price = offering.tokenPrice ? Number(offering.tokenPrice) : 1;
    const computedTokenQty = tokenQuantity
      ? Math.floor(Number(tokenQuantity))
      : price > 0
      ? Math.floor(Number(amountUsd) / price)
      : 1;

    // Validate supply cap if configured
    if (offering.tokenSupply) {
      const allocatedSoFar = (offering.subscriptions || [])
        .filter((s: any) => s.status === 'settled')
        .reduce((sum: number, s: any) => sum + Number(s.tokenQuantity || 0), 0);

      if (allocatedSoFar + computedTokenQty > Number(offering.tokenSupply)) {
        return apiError(
          'EXCEEDS_AVAILABLE_SUPPLY',
          `Requested ${computedTokenQty} tokens exceeds remaining unallocated supply (${
            Number(offering.tokenSupply) - allocatedSoFar
          }).`,
          422
        );
      }
    }

    const effectiveUserId = userId
      ? String(userId)
      : `api_investor:${String(investorWallet).trim()}`;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, effectiveUserId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: effectiveUserId,
        email: investorEmail
          ? String(investorEmail)
          : `wallet:${String(investorWallet).trim()}`,
      });
    }

    const [newSub] = await db
      .insert(subscriptions)
      .values({
        offeringId: offeringIdNum,
        userId: effectiveUserId,
        investorWallet: String(investorWallet).trim(),
        amountUsd: String(amountUsd),
        tokenQuantity: String(computedTokenQty),
        status: 'pending',
      })
      .returning();

    return apiSuccess(newSub, 201);
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to create subscription',
      500
    );
  }
}
