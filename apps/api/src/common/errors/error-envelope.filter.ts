import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import type { ErrorCode, ErrorEnvelope } from "@dx/shared";
import { ApiException } from "./api-exception.js";

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: "VALIDATION_FAILED",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHENTICATED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.TOO_MANY_REQUESTS]: "RATE_LIMITED",
};

const INTERNAL_MESSAGE = "Something went wrong.";

const SAFE_MESSAGES: Partial<Record<ErrorCode, string>> = {
  VALIDATION_FAILED: "The request is invalid.",
  UNAUTHENTICATED: "Sign in to continue.",
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: "Not found.",
  RATE_LIMITED: "Too many attempts. Try again later.",
  INTERNAL: INTERNAL_MESSAGE,
};

/** Converts every thrown error into `{ error: { code, message, retryable } }`. */
@Catch()
export class ErrorEnvelopeFilter implements ExceptionFilter {
  private readonly logger = new Logger("Errors");

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = toEnvelope(exception);

    if (status >= 500) {
      // Log the error class and code only; messages and stacks can carry input values.
      this.logger.error({ msg: "unhandled_error", code: body.error.code, errorName: errorName(exception) });
    }

    res.status(status).setHeader("Cache-Control", "no-store").json(body);
  }
}

export function toEnvelope(exception: unknown): { status: number; body: ErrorEnvelope } {
  if (exception instanceof ApiException) {
    return {
      status: exception.getStatus(),
      body: {
        error: {
          code: exception.code,
          message: exception.message,
          retryable: exception.retryable,
          ...(exception.details ? { details: exception.details } : {}),
        },
      },
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code = STATUS_TO_CODE[status] ?? (status >= 500 ? "INTERNAL" : "VALIDATION_FAILED");
    return {
      status,
      body: {
        error: {
          code,
          message: SAFE_MESSAGES[code] ?? "The request could not be completed.",
          retryable: status === HttpStatus.TOO_MANY_REQUESTS || status >= 500,
        },
      },
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { error: { code: "INTERNAL", message: INTERNAL_MESSAGE, retryable: true } },
  };
}

function errorName(e: unknown): string {
  return e instanceof Error ? e.name : typeof e;
}
