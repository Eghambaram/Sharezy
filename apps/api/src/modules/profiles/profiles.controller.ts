import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { profilePatchSchema, profileViewSchema, type ProfilePatch, type ProfileView } from "@dx/shared";
import { ZodBodyPipe } from "../../common/validation/zod-body.pipe.js";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators.js";
import { ProfilesService } from "./profiles.service.js";

const jsonSchema = (s: z.ZodType) => z.toJSONSchema(s, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;

@ApiTags("me")
@ApiBearerAuth()
@Controller("me/profile")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  @ApiOperation({
    summary: "The customer's reusable profile, verified-contact flags, and completeness.",
    description: "Before the first save, provider-verified email/phone are suggested and `saved` is false.",
  })
  @ApiOkResponse({ schema: jsonSchema(profileViewSchema) })
  get(@CurrentAuth() auth: AuthContext): Promise<ProfileView> {
    return this.profiles.get(auth.userId);
  }

  @Patch()
  @ApiOperation({
    summary: "Partially update the profile.",
    description:
      "Omitted fields are unchanged; null or empty string clears a field. Once any address part is set, " +
      "addressLine1, city, postalCode and country are required. Error code: VALIDATION_FAILED with `details.fields`.",
  })
  @ApiBody({ schema: jsonSchema(profilePatchSchema) })
  @ApiOkResponse({ schema: jsonSchema(profileViewSchema) })
  @ApiBadRequestResponse({ description: "VALIDATION_FAILED" })
  update(@CurrentAuth() auth: AuthContext, @Body(new ZodBodyPipe(profilePatchSchema)) body: ProfilePatch): Promise<ProfileView> {
    return this.profiles.update(auth.userId, body);
  }
}
