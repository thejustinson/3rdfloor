import type { ThirdFloorConfig } from './types';
export declare class HttpClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeoutMs;
    private readonly customFetch;
    constructor(config: ThirdFloorConfig);
    request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map