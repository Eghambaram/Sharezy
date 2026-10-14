import { errorEnvelopeSchema, type ErrorCode } from "@dx/shared";
import type { z } from "zod";
import { publicEnv } from "@/lib/env";

/** Thrown for any non-2xx. UI maps `code` to copy; never show `message` raw. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | "NETWORK" | "BAD_RESPONSE",
    readonly status: number,
    readonly retryable: boolean,
    /** Per-field messages from VALIDATION_FAILED (our own copy, never submitted values). */
    readonly fields: Readonly<Record<string, string>> = {},
  ) {
    super(code);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  orgId?: string;
  signal?: AbortSignal;
}

/**
 * Typed fetch against the API. Validates the success body with `schema` and
 * the error body with the shared envelope. Never caches (`no-store`).
 */
export async function apiFetch<S extends z.ZodType>(path: string, schema: S, opts: RequestOptions = {}): Promise<z.infer<S>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.orgId) headers["X-Org-Id"] = opts.orgId;

  let res: Response;
  try {
    res = await fetch(new URL(path, publicEnv.NEXT_PUBLIC_API_URL), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      credentials: "omit",
      signal: opts.signal,
    });
  } catch {
    throw new ApiError("NETWORK", 0, true);
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const env = errorEnvelopeSchema.safeParse(json);
    if (env.success) {
      const raw = env.data.error.details?.["fields"];
      const fields =
        raw && typeof raw === "object"
          ? Object.fromEntries(Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string"))
          : {};
      throw new ApiError(env.data.error.code, res.status, env.data.error.retryable, fields);
    }
    throw new ApiError("BAD_RESPONSE", res.status, res.status >= 500);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiError("BAD_RESPONSE", res.status, false);
  return parsed.data;
}
