import type { LoggerService, LogLevel } from "@nestjs/common";

/**
 * Structured JSON logger with an allowlist of fields. Anything not on the
 * allowlist is replaced with "[redacted]", so personal data, tokens, codes and
 * OTPs can't leak through an accidental `logger.log({ ...req.body })`.
 */
export const LOG_FIELD_ALLOWLIST: ReadonlySet<string> = new Set([
  "msg",
  "context",
  "level",
  "time",
  "code",
  "errorName",
  "status",
  "method",
  "route",
  "durationMs",
  "requestId",
  "userId",
  "organizationId",
  "sessionId",
  "grantId",
  "count",
  "port",
  "authMode",
  "env",
]);

const REDACTED = "[redacted]";

export function redact(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!LOG_FIELD_ALLOWLIST.has(key)) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = typeof value === "object" && value !== null ? REDACTED : value;
  }
  return out;
}

type Writer = (line: string) => void;

export class JsonLogger implements LoggerService {
  constructor(
    private readonly write: Writer = (line) => process.stdout.write(line + "\n"),
    private readonly minLevel: LogLevel = "log",
  ) {}

  log(message: unknown, context?: string): void {
    this.emit("log", message, context);
  }
  error(message: unknown, _trace?: string, context?: string): void {
    // Stack traces are intentionally dropped: they can embed input values.
    this.emit("error", message, context);
  }
  warn(message: unknown, context?: string): void {
    this.emit("warn", message, context);
  }
  debug(message: unknown, context?: string): void {
    this.emit("debug", message, context);
  }
  verbose(message: unknown, context?: string): void {
    this.emit("verbose", message, context);
  }

  private emit(level: LogLevel, message: unknown, context?: string): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return;
    const fields = typeof message === "object" && message !== null ? (message as Record<string, unknown>) : { msg: String(message) };
    const line = { time: new Date().toISOString(), level, ...(context ? { context } : {}), ...redact(fields) };
    this.write(JSON.stringify(line));
  }
}

const LEVEL_RANK: Record<LogLevel, number> = { verbose: 0, debug: 1, log: 2, warn: 3, error: 4, fatal: 5 };
