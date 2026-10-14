import { createParamDecorator, SetMetadata, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface AuthContext {
  readonly userId: string;
  readonly subject: string;
}

export interface AuthedRequest extends Request {
  auth?: AuthContext;
}

export const IS_PUBLIC = "dx:isPublic";

/** Opts a route out of the global AuthGuard. Use sparingly. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

/** The authenticated caller. Only valid on non-@Public routes. */
export const CurrentAuth = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.auth) throw new Error("CurrentAuth used on a route without AuthGuard");
  return req.auth;
});
