import { HttpStatus, Injectable, type PipeTransform } from "@nestjs/common";
import type { z } from "zod";
import { ApiException } from "../errors/api-exception.js";

/**
 * Validates a request body against a shared Zod contract, so the API and web
 * enforce identical rules. Error details name fields and our own messages —
 * never the submitted values.
 */
@Injectable()
export class ZodBodyPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.map(String).join(".") || "(body)";
      // Unknown-key issues carry the key names, which are not personal data.
      fields[path] ??= issue.code === "unrecognized_keys" ? `Unknown field(s): ${issue.keys.join(", ")}` : issue.message;
    }
    throw new ApiException("VALIDATION_FAILED", HttpStatus.BAD_REQUEST, "The request is invalid.", false, { fields });
  }
}
