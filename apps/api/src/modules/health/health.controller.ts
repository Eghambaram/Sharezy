import { Controller, Get, Header, HttpStatus } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ApiException } from "../../common/errors/api-exception.js";
import { InjectConfig } from "../../config/config.module.js";
import type { AppConfig } from "../../config/env.js";
import { Public } from "../auth/auth.decorators.js";

@ApiTags("health")
@Public()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  @Get("health")
  @Header("Cache-Control", "no-store")
  @ApiOperation({ summary: "Liveness: the process is up." })
  @ApiOkResponse({ schema: { example: { status: "ok", authMode: "dev" } } })
  health(): { status: "ok"; authMode: AppConfig["AUTH_MODE"] } {
    return { status: "ok", authMode: this.config.AUTH_MODE };
  }

  @Get("ready")
  @Header("Cache-Control", "no-store")
  @ApiOperation({ summary: "Readiness: the database is reachable." })
  @ApiOkResponse({ schema: { example: { status: "ready" } } })
  @ApiServiceUnavailableResponse({ description: "Database unreachable" })
  async ready(): Promise<{ status: "ready" }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ApiException("INTERNAL", HttpStatus.SERVICE_UNAVAILABLE, "Database unreachable", true);
    }
    return { status: "ready" };
  }
}
