import { HttpStatus, Inject, Injectable, Logger, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiException } from "../../common/errors/api-exception.js";
import { UsersService } from "../users/users.service.js";
import { AUTH_PROVIDER, InvalidTokenError, type AuthProvider } from "./auth-provider.js";
import { IS_PUBLIC, type AuthedRequest } from "./auth.decorators.js";

const BEARER = /^Bearer ([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/;

/**
 * Global guard: every route requires a valid bearer token unless marked
 * @Public(). Verifies the token, then upserts the local User by subject.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger("Auth");

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_PROVIDER) private readonly provider: AuthProvider,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const match = BEARER.exec(req.headers.authorization ?? "");
    if (!match?.[1]) throw unauthenticated();

    let subject: string;
    try {
      ({ subject } = await this.provider.verify(match[1]));
    } catch (e) {
      if (e instanceof InvalidTokenError) {
        this.logger.warn({ msg: "token_rejected", code: e.reason });
        throw unauthenticated();
      }
      throw e;
    }

    const user = await this.users.resolveFromProvider(subject, this.provider);
    if (!user) throw unauthenticated();

    req.auth = { userId: user.id, subject };
    return true;
  }
}

function unauthenticated(): ApiException {
  return new ApiException("UNAUTHENTICATED", HttpStatus.UNAUTHORIZED, "Sign in to continue.", false);
}
