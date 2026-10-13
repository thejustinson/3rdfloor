import crypto from 'crypto';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKeyPair(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomSecret = crypto.randomBytes(24).toString('hex');
  const rawKey = `3f_live_${randomSecret}`;
  const keyPrefix = `3f_live_${randomSecret.slice(0, 8)}...`;
  const keyHash = hashApiKey(rawKey);

  return { rawKey, keyPrefix, keyHash };
}

export type ApiAuthResult =
  | {
      authenticated: true;
      apiKeyId: number;
      organizationId: number;
      organization: {
        id: number;
        name: string;
        slug: string;
        kybStatus: string;
      };
    }
  | {
      authenticated: false;
      status: number;
      code: string;
      message: string;
    };

export async function authenticateApiKey(req: Request): Promise<ApiAuthResult> {
  const authHeader = req.headers.get('authorization');
  const xApiKey = req.headers.get('x-api-key');

  let rawKey: string | null = null;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    rawKey = authHeader.slice(7).trim();
  } else if (xApiKey) {
    rawKey = xApiKey.trim();
  }

  if (!rawKey) {
    return {
      authenticated: false,
      status: 401,
      code: 'MISSING_API_KEY',
      message:
        'Missing API key. Provide Authorization: Bearer 3f_live_<secret> or x-api-key header.',
    };
  }

  const keyHash = hashApiKey(rawKey);

  try {
    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, 'active')),
      with: {
        organization: true,
      },
    });

    if (!keyRecord || !keyRecord.organization) {
      return {
        authenticated: false,
        status: 401,
        code: 'INVALID_OR_REVOKED_API_KEY',
        message: 'The provided API key is invalid or has been revoked.',
      };
    }

    // Update lastUsedAt timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    return {
      authenticated: true,
      apiKeyId: keyRecord.id,
      organizationId: keyRecord.organizationId,
      organization: keyRecord.organization,
    };
  } catch (error) {
    console.error('API authentication error:', error);
    return {
      authenticated: false,
      status: 500,
      code: 'INTERNAL_AUTH_ERROR',
      message: 'Failed to verify API key.',
    };
  }
}

export function apiSuccess(data: unknown, status: number = 200) {
  return Response.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function apiError(code: string, message: string, status: number = 400) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

