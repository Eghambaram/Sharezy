import { BadRequestException, HttpStatus, NotFoundException } from "@nestjs/common";
import { ApiException } from "./api-exception.js";
import { toEnvelope } from "./error-envelope.filter.js";

describe("toEnvelope", () => {
  it("passes ApiException codes through", () => {
    const { status, body } = toEnvelope(
      new ApiException("SESSION_ALREADY_DECIDED", HttpStatus.CONFLICT, "Already decided", false),
    );
    expect(status).toBe(409);
    expect(body).toEqual({ error: { code: "SESSION_ALREADY_DECIDED", message: "Already decided", retryable: false } });
  });

  it("maps framework exceptions to safe messages, not their raw text", () => {
    const { body } = toEnvelope(new BadRequestException("email alex@example.com is invalid"));
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(JSON.stringify(body)).not.toContain("alex@example.com");
    expect(toEnvelope(new NotFoundException()).body.error.code).toBe("NOT_FOUND");
  });

  it("hides unknown errors as INTERNAL", () => {
    const { status, body } = toEnvelope(new Error("db password=hunter2"));
    expect(status).toBe(500);
    expect(body.error).toEqual({ code: "INTERNAL", message: "Something went wrong.", retryable: true });
  });
});
