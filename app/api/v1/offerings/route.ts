import { db } from '@/db';
import { offerings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  try {
    const orgOfferings = await db.query.offerings.findMany({
      where: eq(offerings.organizationId, auth.organizationId),
      with: {
        asset: true,
        tokens: true,
      },
      orderBy: (offerings, { desc }) => [desc(offerings.createdAt)],
    });

    return apiSuccess(orgOfferings);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to fetch offerings', 500);
  }
}

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  try {
    const body = await req.json();
    const {
      assetId,
      name,
      description,
      targetRaise,
      tokenName,
      tokenSymbol,
      tokenStandard,
      tokenSupply,
      tokenPrice,
    } = body;

    if (!assetId || !name) {
      return apiError(
        'VALIDATION_ERROR',
        'Fields "assetId" and "name" are required.',
        422
      );
    }

    const assetIdNum = Number(assetId);
    const asset = await db.query.assets.findFirst({
      where: (assets, { and, eq }) =>
        and(
          eq(assets.id, assetIdNum),
          eq(assets.organizationId, auth.organizationId)
        ),
    });

    if (!asset) {
      return apiError(
        'ASSET_NOT_FOUND',
        `Asset #${assetIdNum} does not exist in this organization.`,
        404
      );
    }

    const [newOffering] = await db
      .insert(offerings)
      .values({
        organizationId: auth.organizationId,
        assetId: assetIdNum,
        name: String(name).trim(),
        description: description ? String(description) : null,
        targetRaise: targetRaise ? String(targetRaise) : null,
        tokenName: tokenName ? String(tokenName).trim() : null,
        tokenSymbol: tokenSymbol ? String(tokenSymbol).trim().toUpperCase() : null,
        tokenStandard: tokenStandard ? String(tokenStandard) : 'Token-2022',
        tokenSupply: tokenSupply ? String(tokenSupply) : null,
        tokenPrice: tokenPrice ? String(tokenPrice) : null,
        status: 'draft',
      })
      .returning();

    return apiSuccess(newOffering, 201);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to create offering', 500);
  }
}
