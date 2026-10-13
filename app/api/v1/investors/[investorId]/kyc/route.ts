import { NextRequest } from 'next/server';
import { db } from '@/db';
import { investors } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

const VALID_KYC_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
const VALID_INVESTOR_TYPES = [
  'individual',
  'accredited',
  'institutional',
  'qualified_purchaser',
] as const;

function buildKycPayload(
  investor: typeof investors.$inferSelect,
  extraMeta?: { provider?: string; referenceId?: string; notes?: string }
) {
  const isApproved = investor.kycStatus === 'approved';
  const hasWallet = Boolean(investor.walletAddress && investor.walletAddress.trim().length >= 32);

  return {
    investorId: investor.id,
    organizationId: investor.organizationId,
    name: investor.name,
    email: investor.email,
    kycStatus: investor.kycStatus,
    investorType: investor.investorType,
    jurisdiction: investor.jurisdiction,
    walletAddress: investor.walletAddress,
    eligibleForSettlement: isApproved && hasWallet,
    complianceChecks: {
      identityVerified: isApproved,
      accreditationAttested:
        isApproved &&
        ['accredited', 'institutional', 'qualified_purchaser'].includes(
          investor.investorType
        ),
      sanctionsScreened: investor.kycStatus !== 'rejected' && investor.kycStatus !== 'suspended',
      walletWhitelisted: isApproved && hasWallet,
    },
    verification: {
      provider: extraMeta?.provider || '3rdfloor_compliance',
      referenceId: extraMeta?.referenceId || `kyc_inv_${investor.id}`,
      notes: extraMeta?.notes || null,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

/**
 * GET /api/v1/investors/:investorId/kyc
 * Retrieves the investor's KYC verification state, accreditation tier,
 * jurisdiction, wallet whitelist status, and settlement eligibility.
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
    return apiError('VALIDATION_ERROR', 'Parameter "investorId" must be a valid integer.', 400);
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

    return apiSuccess(buildKycPayload(investor));
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to retrieve investor KYC record.',
      500
    );
  }
}

/**
 * POST & PATCH /api/v1/investors/:investorId/kyc
 * Submits or updates an investor's KYC verification status, accreditation classification,
 * ISO jurisdiction, and whitelisted Solana Token-2022 wallet address.
 */
async function upsertKycHandler(
  req: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) return apiError(auth.code, auth.message, auth.status);

  const { investorId } = await params;
  const id = parseInt(investorId, 10);
  if (isNaN(id)) {
    return apiError('VALIDATION_ERROR', 'Parameter "investorId" must be a valid integer.', 400);
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
      kycStatus,
      investorType,
      jurisdiction,
      walletAddress,
      provider,
      referenceId,
      notes,
    } = body || {};

    if (
      kycStatus !== undefined &&
      !VALID_KYC_STATUSES.includes(kycStatus)
    ) {
      return apiError(
        'VALIDATION_ERROR',
        `Invalid kycStatus "${kycStatus}". Allowed values: ${VALID_KYC_STATUSES.join(', ')}.`,
        422
      );
    }

    if (
      investorType !== undefined &&
      !VALID_INVESTOR_TYPES.includes(investorType)
    ) {
      return apiError(
        'VALIDATION_ERROR',
        `Invalid investorType "${investorType}". Allowed values: ${VALID_INVESTOR_TYPES.join(', ')}.`,
        422
      );
    }

    const [updated] = await db
      .update(investors)
      .set({
        kycStatus: kycStatus || existing.kycStatus,
        investorType: investorType || existing.investorType,
        jurisdiction: jurisdiction
          ? String(jurisdiction).trim().toUpperCase()
          : existing.jurisdiction,
        walletAddress:
          walletAddress !== undefined
            ? walletAddress
              ? String(walletAddress).trim()
              : null
            : existing.walletAddress,
      })
      .where(eq(investors.id, id))
      .returning();

    return apiSuccess(
      buildKycPayload(updated, { provider, referenceId, notes })
    );
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to update investor KYC record.',
      500
    );
  }
}

export const POST = upsertKycHandler;
export const PATCH = upsertKycHandler;
