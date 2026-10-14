import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { isFieldKey, type ActivityPage, type FieldKey } from "@dx/shared";
import { ApiException } from "../../common/errors/api-exception.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators.js";

const MAX_LIMIT = 50;

/** The signed-in customer's own consent decisions (receipts). Detail view: Phase 6. */
@ApiTags("me")
@ApiBearerAuth()
@Controller("me/activity")
export class ActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Your sharing decisions, newest first. Cursor-paginated." })
  @ApiQuery({ name: "limit", required: false, schema: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: 20 } })
  @ApiQuery({ name: "cursor", required: false, schema: { type: "string" } })
  @ApiOkResponse({ description: "{ items, nextCursor }" })
  async list(
    @CurrentAuth() auth: AuthContext,
    @Query("limit") limitRaw?: string,
    @Query("cursor") cursor?: string,
  ): Promise<ActivityPage> {
    const limit = limitRaw === undefined ? 20 : Number(limitRaw);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new ApiException("VALIDATION_FAILED", HttpStatus.BAD_REQUEST, "Invalid limit.", false, {
        fields: { limit: `Use a whole number from 1 to ${MAX_LIMIT}` },
      });
    }
    if (cursor !== undefined && !/^[a-z0-9_]{1,64}$/.test(cursor)) {
      throw new ApiException("VALIDATION_FAILED", HttpStatus.BAD_REQUEST, "Invalid cursor.");
    }

    const rows = await this.prisma.consentGrant.findMany({
      // Scoped to the caller; the cursor can't widen it.
      where: { customerId: auth.userId, hiddenByCustomerAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        receiptId: true,
        orgNameSnapshot: true,
        purposeSnapshot: true,
        decision: true,
        requestedKeys: true,
        approvedKeys: true,
        createdAt: true,
        isSample: true,
      },
    });

    const page = rows.slice(0, limit);
    return {
      items: page.map((g) => ({
        grantId: g.id,
        receiptId: g.receiptId,
        organizationName: g.orgNameSnapshot,
        purpose: g.purposeSnapshot,
        decision: g.decision,
        requestedKeys: g.requestedKeys.filter(isFieldKey) as FieldKey[],
        sharedKeys: g.approvedKeys.filter(isFieldKey) as FieldKey[],
        decidedAt: g.createdAt.toISOString(),
        isSample: g.isSample,
      })),
      nextCursor: rows.length > limit ? (page[page.length - 1]?.id ?? null) : null,
    };
  }
}
