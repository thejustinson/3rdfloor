import { ThirdFloorError } from './errors';
export class HttpClient {
    apiKey;
    baseUrl;
    timeoutMs;
    customFetch;
    constructor(config) {
        if (!config?.apiKey || !config.apiKey.trim()) {
            throw new ThirdFloorError({
                code: 'MISSING_API_KEY',
                message: 'A valid 3rdfloor workspace secret key ("3f_live_...") is required to initialize ThirdFloor.',
                status: 401,
            });
        }
        this.apiKey = config.apiKey.trim();
        this.baseUrl = (config.baseUrl || 'http://localhost:3000/api/v1').replace(/\/+$/, '');
        this.timeoutMs = config.timeoutMs ?? 30_000;
        this.customFetch = config.fetch ?? globalThis.fetch.bind(globalThis);
    }
    async request(method, path, body) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${this.baseUrl}${normalizedPath}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const init = {
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
                const errPayload = payload;
                throw new ThirdFloorError({
                    code: errPayload?.error?.code || `HTTP_${response.status}`,
                    message: errPayload?.error?.message ||
                        `3rdfloor API request failed with HTTP ${response.status}`,
                    status: response.status,
                    raw: payload,
                });
            }
            if (payload && typeof payload === 'object' && 'data' in payload) {
                return payload.data;
            }
            return payload;
        }
        catch (err) {
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
        }
        finally {
            clearTimeout(timer);
        }
    }
}
//# sourceMappingURL=client.js.map