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
        asset: true,
        tokens: true,
        subscriptions: true,
        distributions: true,
      },
    });

    if (!offering) {
      return apiError(
        'NOT_FOUND',
        `Offering #${offeringIdNum} not found in this organization workspace.`,
        404
      );
    }

    return apiSuccess(offering);
  } catch (error: any) {
    return apiError('INTERNAL_ERROR', error.message || 'Failed to fetch offering', 500);
  }
}
