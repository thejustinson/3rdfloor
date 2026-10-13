/**
 * Structured error thrown when a 3rdfloor API call returns a non-2xx status code
 * or fails validation.
 */
export class ThirdFloorError extends Error {
    code;
    status;
    raw;
    constructor(options) {
        super(options.message);
        this.name = 'ThirdFloorError';
        this.code = options.code;
        this.status = options.status;
        this.raw = options.raw;
        Object.setPrototypeOf(this, ThirdFloorError.prototype);
    }
}
//# sourceMappingURL=errors.js.map