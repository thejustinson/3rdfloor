/**
 * Structured error thrown when a 3rdfloor API call returns a non-2xx status code
 * or fails validation.
 */
export class ThirdFloorError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly raw?: unknown;

  constructor(options: {
    code: string;
    message: string;
    status: number;
    raw?: unknown;
  }) {
    super(options.message);
    this.name = 'ThirdFloorError';
    this.code = options.code;
    this.status = options.status;
    this.raw = options.raw;
    Object.setPrototypeOf(this, ThirdFloorError.prototype);
  }
}
