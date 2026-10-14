import { randomBytes } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  UseGuards,
  type CanActivate,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsIn, IsString, Length, Matches } from "class-validator";
import type { DevToken, DevUser } from "@dx/shared";
import { ApiException } from "../../common/errors/api-exception.js";
import { InjectConfig } from "../../config/config.module.js";
import type { AppConfig } from "../../config/env.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AUTH_PROVIDER, type AuthProvider } from "../auth/auth-provider.js";
import { Public } from "../auth/auth.decorators.js";
import { DevAuthProvider } from "../auth/dev-auth-provider.js";

/** Synthetic users are identified by this subject prefix. */
export const DEV_SUBJECT_PREFIX = "dev-";

/** 404s unless AUTH_MODE=dev outside production, so the routes don't exist otherwise. */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(@InjectConfig() private readonly config: AppConfig) {}
  canActivate(): boolean {
    if (this.config.AUTH_MODE !== "dev" || this.config.NODE_ENV === "production") {
      throw new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, "Not found.");
    }
    return true;
  }
}

class IssueTokenDto {
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-z0-9]+$/)
  userId!: string;
}

class CreateDevUserDto {
  @IsIn(["customer"])
  kind!: "customer";
}

@ApiTags("dev-auth (AUTH_MODE=dev only)")
@Public()
@UseGuards(DevOnlyGuard)
@Controller("dev-auth")
export class DevAuthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_PROVIDER) private readonly provider: AuthProvider,
  ) {}

  @Get("users")
  @ApiOperation({ summary: "Synthetic users available for simulated sign-in." })
  async users(): Promise<DevUser[]> {
    const users = await this.prisma.user.findMany({
      where: { isSample: true, deletedAt: null, authSubject: { startsWith: DEV_SUBJECT_PREFIX } },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        memberships: { include: { organization: { select: { name: true } } }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });
    return users.map((u) => {
      const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ");
      const org = u.memberships[0]?.organization.name ?? null;
      return {
        id: u.id,
        displayName: name || "New synthetic user",
        kind: org ? "business" : "customer",
        organizationName: org,
      };
    });
  }

  @Post("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Issue a dev JWT for a synthetic user." })
  async token(@Body() body: IssueTokenDto): Promise<DevToken> {
    const user = await this.prisma.user.findFirst({
      where: { id: body.userId, isSample: true, deletedAt: null, authSubject: { startsWith: DEV_SUBJECT_PREFIX } },
      select: { authSubject: true },
    });
    if (!user) throw new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, "Unknown synthetic user.");
    return this.issue(user.authSubject);
  }

  @Post("users")
  @ApiOperation({ summary: "Create a fresh synthetic user (to test first sign-in) and issue a token." })
  async create(@Body() body: CreateDevUserDto): Promise<DevToken> {
    const subject = `${DEV_SUBJECT_PREFIX}new-${body.kind}-${randomBytes(6).toString("hex")}`;
    await this.prisma.user.create({ data: { authSubject: subject, isSample: true } });
    return this.issue(subject);
  }

  private async issue(subject: string): Promise<DevToken> {
    if (!(this.provider instanceof DevAuthProvider)) {
      throw new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, "Not found.");
    }
    const { token, expiresAt } = await this.provider.issue(subject);
    return { token, expiresAt: expiresAt.toISOString() };
  }
}
