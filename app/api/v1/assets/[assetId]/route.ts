import { db } from '@/db';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  const { assetId } = await params;
  const assetIdNum = parseInt(assetId, 10);
  if (isNaN(assetIdNum)) {
    return apiError('INVALID_ID', 'Asset ID must be a valid integer.', 400);
  }

  try {
    const asset = await db.query.assets.findFirst({
      where: (assets, { and, eq }) =>
        and(
          eq(assets.id, assetIdNum),
          eq(assets.organizationId, auth.organizationId)
        ),
      with: {
        offerings: {
          with: {
            tokens: true,
          },
        },
      },
    });

    if (!asset) {
      return apiError(
        'NOT_FOUND',
        `Asset #${assetIdNum} not found in this organization workspace.`,
        404
      );
    }

    return apiSuccess(asset);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to fetch asset', 500);
  }
}
