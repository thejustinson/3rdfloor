import { NextRequest } from 'next/server';
import { db } from '@/db';
import { investors, offerings } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

/**
 * GET /api/v1/investors/:investorId
 * Retrieves an investor profile along with their subscriptions and settled holdings
 * across the authenticated organization's offerings.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) return apiError(auth.code, auth.message, auth.status);

  const { investorId } = await params;
  const id = parseInt(investorId, 10);
  if (isNaN(id)) {
    return apiError('VALIDATION_ERROR', 'Invalid investorId parameter.', 400);
  }

  try {
    const investor = await db.query.investors.findFirst({
      where: and(
        eq(investors.id, id),
        eq(investors.organizationId, auth.organizationId)
      ),
    });

    if (!investor) {
      return apiError(
        'NOT_FOUND',
        `Investor #${id} not found in your organization workspace.`,
        404
      );
    }

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

    const investorSubscriptions = orgOfferings.flatMap((off) =>
      (off.subscriptions || [])
        .filter(
          (s: any) =>
            (investor.walletAddress && s.investorWallet === investor.walletAddress) ||
            (s.user?.email && s.user.email.toLowerCase() === investor.email.toLowerCase())
        )
        .map((s: any) => ({
          id: s.id,
          offeringId: off.id,
          offeringName: off.name,
          tokenSymbol: off.tokenSymbol,
          investorWallet: s.investorWallet,
          amountUsd: s.amountUsd,
          tokenQuantity: s.tokenQuantity,
          status: s.status,
          transactionSignature: s.transactionSignature,
          createdAt: s.createdAt,
        }))
    );

    return apiSuccess({
      ...investor,
      subscriptions: investorSubscriptions,
    });
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to fetch investor.', 500);
  }
}

/**
 * PATCH & POST /api/v1/investors/:investorId
 * Updates an investor's KYC eligibility status, wallet address, classification, or jurisdiction.
 */
async function updateInvestorHandler(
  req: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) return apiError(auth.code, auth.message, auth.status);

  const { investorId } = await params;
  const id = parseInt(investorId, 10);
  if (isNaN(id)) {
    return apiError('VALIDATION_ERROR', 'Invalid investorId parameter.', 400);
  }

  try {
    const existing = await db.query.investors.findFirst({
      where: and(
        eq(investors.id, id),
        eq(investors.organizationId, auth.organizationId)
      ),
    });

    if (!existing) {
      return apiError(
        'NOT_FOUND',
        `Investor #${id} not found in your organization workspace.`,
        404
      );
    }

    const body = await req.json();
    const {
      name,
      walletAddress,
      investorType,
      jurisdiction,
      kycStatus,
    } = body || {};

    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (kycStatus && !validStatuses.includes(kycStatus)) {
      return apiError(
        'VALIDATION_ERROR',
        `Invalid kycStatus. Allowed: ${validStatuses.join(', ')}`,
        400
      );
    }

    const validTypes = [
      'individual',
      'accredited',
      'institutional',
      'qualified_purchaser',
    ];
    if (investorType && !validTypes.includes(investorType)) {
      return apiError(
        'VALIDATION_ERROR',
        `Invalid investorType. Allowed: ${validTypes.join(', ')}`,
        400
      );
    }

    const [updated] = await db
      .update(investors)
      .set({
        name: name ? String(name).trim() : existing.name,
        walletAddress:
          walletAddress !== undefined
            ? walletAddress
              ? String(walletAddress).trim()
              : null
            : existing.walletAddress,
        investorType: investorType || existing.investorType,
        jurisdiction: jurisdiction
          ? String(jurisdiction).trim().toUpperCase()
          : existing.jurisdiction,
        kycStatus: kycStatus || existing.kycStatus,
      })
      .where(eq(investors.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to update investor.', 500);
  }
}

export const PATCH = updateInvestorHandler;
export const POST = updateInvestorHandler;
