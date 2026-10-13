import { db } from '@/db';
import { investors, subscriptions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  const { subscriptionId } = await params;
  const subIdNum = parseInt(subscriptionId, 10);
  if (isNaN(subIdNum)) {
    return apiError('INVALID_ID', 'Subscription ID must be a valid integer.', 400);
  }

  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subIdNum),
      with: {
        offering: {
          with: {
            tokens: true,
          },
        },
      },
    });

    if (!sub || !sub.offering || sub.offering.organizationId !== auth.organizationId) {
      return apiError(
        'NOT_FOUND',
        `Subscription #${subIdNum} not found in this organization workspace.`,
        404
      );
    }

    // Idempotent check: if already settled, return existing settled record
    if (sub.status === 'settled') {
      return apiSuccess({
        subscription: sub,
        idempotentReplay: true,
      });
    }

    const tokenRecord = sub.offering.tokens?.[0];
    if (!tokenRecord?.mintAddress) {
      return apiError(
        'TOKEN_NOT_DEPLOYED',
        'Offering does not have a deployed Solana token mint yet.',
        422
      );
    }

    const qty = Math.max(1, Math.floor(Number(sub.tokenQuantity || 1)));
    const walletTarget = sub.investorWallet || sub.userId;

    // Enforce Investor KYC compliance gate if investor profile exists for this wallet
    if (sub.investorWallet) {
      const matchedInvestor = await db.query.investors.findFirst({
        where: and(
          eq(investors.organizationId, auth.organizationId),
          eq(investors.walletAddress, sub.investorWallet)
        ),
      });

      if (
        matchedInvestor &&
        (matchedInvestor.kycStatus === 'rejected' ||
          matchedInvestor.kycStatus === 'suspended')
      ) {
        return apiError(
          'KYC_NOT_APPROVED',
          `Investor #${matchedInvestor.id} (${matchedInvestor.name}) has KYC status "${matchedInvestor.kycStatus}". Approve KYC via POST /api/v1/investors/${matchedInvestor.id}/kyc before settling Token-2022 allocations.`,
          403
        );
      }
    }

    const { allocateTokensToInvestor } = await import('@/lib/solana');
    const { transactionSignature, destinationWallet } =
      await allocateTokensToInvestor(
        tokenRecord.mintAddress,
        walletTarget,
        qty,
        tokenRecord.decimals || 0
      );

    const [updatedSub] = await db
      .update(subscriptions)
      .set({
        status: 'settled',
        transactionSignature,
        investorWallet: destinationWallet,
      })
      .where(eq(subscriptions.id, subIdNum))
      .returning();

    return apiSuccess({
      subscription: updatedSub,
      solanaExplorerUrl: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
    });
  } catch (error: any) {
    return apiError(
      'SETTLEMENT_ERROR',
      error.message || 'Failed to settle subscription on Solana',
      500
    );
  }
}
