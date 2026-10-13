/**
 * Structured error thrown when a 3rdfloor API call returns a non-2xx status code
 * or fails validation.
 */
export declare class ThirdFloorError extends Error {
    readonly code: string;
    readonly status: number;
    readonly raw?: unknown;
    constructor(options: {
        code: string;
        message: string;
        status: number;
        raw?: unknown;
    });
}
//# sourceMappingURL=errors.d.ts.map