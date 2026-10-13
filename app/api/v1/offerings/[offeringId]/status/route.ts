import { db } from '@/db';
import { offerings, tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

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
    const body = await req.json();
    const { status, deployToken } = body;

    const validStatuses = ['draft', 'under_review', 'approved', 'open', 'paused', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return apiError(
        'VALIDATION_ERROR',
        `Field "status" must be one of: ${validStatuses.join(', ')}`,
        422
      );
    }

    const offering = await db.query.offerings.findFirst({
      where: (offerings, { and, eq }) =>
        and(
          eq(offerings.id, offeringIdNum),
          eq(offerings.organizationId, auth.organizationId)
        ),
      with: {
        tokens: true,
      },
    });

    if (!offering) {
      return apiError(
        'NOT_FOUND',
        `Offering #${offeringIdNum} not found in this organization workspace.`,
        404
      );
    }

    let deployedTokenRecord = offering.tokens?.[0] || null;

    if (deployToken && !deployedTokenRecord) {
      const { createTokenMint } = await import('@/lib/solana');
      const mintName = offering.tokenName || offering.name;
      const mintSymbol =
        offering.tokenSymbol ||
        offering.name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .substring(0, 4)
          .toUpperCase();
      const mintSupply = offering.tokenSupply ? parseInt(offering.tokenSupply, 10) : 0;

      const {
        mintAddress,
        mintAuthority,
        freezeAuthority,
        transactionSignature,
      } = await createTokenMint(
        0,
        mintName,
        mintSymbol,
        'https://3rdfloor.app',
        mintSupply
      );

      const [insertedToken] = await db
        .insert(tokens)
        .values({
          offeringId: offeringIdNum,
          mintAddress,
          decimals: 0,
          initialSupply: mintSupply ? mintSupply.toString() : null,
          mintAuthority,
          freezeAuthority,
          transactionSignature,
          status: 'confirmed',
        })
        .returning();

      deployedTokenRecord = insertedToken;
    }

    const [updatedOffering] = await db
      .update(offerings)
      .set({ status })
      .where(eq(offerings.id, offeringIdNum))
      .returning();

    return apiSuccess({
      offering: updatedOffering,
      token: deployedTokenRecord,
    });
  } catch (error: any) {
    return apiError(
      'INTERNAL_ERROR',
      error.message || 'Failed to update offering status',
      500
    );
  }
}
