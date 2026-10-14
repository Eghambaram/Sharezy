import { HttpException, HttpStatus } from "@nestjs/common";
import type { ErrorCode } from "@dx/shared";

/**
 * The only exception feature code should throw for expected failures.
 * `message` is developer-facing; the UI maps `code` to copy.
 * `details` must never contain personal data values.
 */
export class ApiException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    message: string,
    readonly retryable = false,
    readonly details?: Record<string, unknown>,
  ) {
    super(message, status);
  }
}
