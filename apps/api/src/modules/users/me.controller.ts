import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import type { Me } from "@dx/shared";
import { ApiException } from "../../common/errors/api-exception.js";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators.js";
import { UsersService } from "./users.service.js";

@ApiTags("me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "The signed-in user, provider-verified contacts, and organization memberships." })
  @ApiOkResponse({
    schema: {
      example: {
        id: "cm...",
        email: null,
        emailVerified: false,
        phone: "+919876543210",
        phoneVerified: true,
        isSample: false,
        memberships: [{ organizationId: "cm...", organizationName: "Maple Grove Properties", role: "OWNER", isSample: true }],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "UNAUTHENTICATED — missing, invalid, or expired token" })
  async me(@CurrentAuth() auth: AuthContext): Promise<Me> {
    const me = await this.users.getMe(auth.userId);
    if (!me) throw new ApiException("UNAUTHENTICATED", HttpStatus.UNAUTHORIZED, "Sign in to continue.");
    return me;
  }
}
