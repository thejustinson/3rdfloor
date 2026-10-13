import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey, apiSuccess, apiError } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  try {
    const orgAssets = await db.query.assets.findMany({
      where: eq(assets.organizationId, auth.organizationId),
      with: {
        offerings: true,
      },
      orderBy: (assets, { desc }) => [desc(assets.createdAt)],
    });

    return apiSuccess(orgAssets);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to fetch assets', 500);
  }
}

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.authenticated) {
    return apiError(auth.code, auth.message, auth.status);
  }

  try {
    const body = await req.json();
    const { name, category, declaredValuation, currency, description } = body;

    if (!name || !category) {
      return apiError(
        'VALIDATION_ERROR',
        'Fields "name" and "category" are required.',
        422
      );
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        organizationId: auth.organizationId,
        name: String(name).trim(),
        category: String(category).trim(),
        declaredValuation: declaredValuation ? String(declaredValuation) : null,
        currency: currency ? String(currency) : 'USD',
        description: description ? String(description) : null,
        status: 'draft',
      })
      .returning();

    return apiSuccess(newAsset, 201);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to create asset', 500);
  }
}
