import { ThirdFloorError } from './errors';
import type { ApiErrorPayload, ApiResponse, ThirdFloorConfig } from './types';

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly customFetch: typeof fetch;

  constructor(config: ThirdFloorConfig) {
    if (!config?.apiKey || !config.apiKey.trim()) {
      throw new ThirdFloorError({
        code: 'MISSING_API_KEY',
        message:
          'A valid 3rdfloor workspace secret key ("3f_live_...") is required to initialize ThirdFloor.',
        status: 401,
      });
    }

    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || 'http://localhost:3000/api/v1').replace(
      /\/+$/,
      ''
    );
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.customFetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  public async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${normalizedPath}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const init: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@3rdfloor/sdk/1.0.0',
        },
        signal: controller.signal,
      };

      if (body !== undefined && method !== 'GET') {
        init.body = JSON.stringify(body);
      }

      const response = await this.customFetch(url, init);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errPayload = payload as ApiErrorPayload | null;
        throw new ThirdFloorError({
          code: errPayload?.error?.code || `HTTP_${response.status}`,
          message:
            errPayload?.error?.message ||
            `3rdfloor API request failed with HTTP ${response.status}`,
          status: response.status,
          raw: payload,
        });
      }

      if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as ApiResponse<T>).data;
      }

      return payload as T;
    } catch (err: any) {
      if (err instanceof ThirdFloorError) {
        throw err;
      }
      if (err?.name === 'AbortError') {
        throw new ThirdFloorError({
          code: 'REQUEST_TIMEOUT',
          message: `Request to ${method} ${path} timed out after ${this.timeoutMs}ms.`,
          status: 408,
        });
      }
      throw new ThirdFloorError({
        code: 'NETWORK_ERROR',
        message: err?.message || 'Network request to 3rdfloor API failed.',
        status: 500,
        raw: err,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
