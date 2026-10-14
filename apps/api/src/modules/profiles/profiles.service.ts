import { HttpStatus, Injectable } from "@nestjs/common";
import {
  EMPTY_PROFILE,
  PROFILE_TEXT_FIELDS,
  profileCompleteness,
  profileRecordIssues,
  type ProfilePatch,
  type ProfileRecord,
  type ProfileTextField,
  type ProfileView,
} from "@dx/shared";
import { ApiException } from "../../common/errors/api-exception.js";
import type { CustomerProfile, User } from "../../generated/prisma/client.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<ProfileView> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
    return toView(user, user.profile);
  }

  /**
   * Applies a partial update. Record-level rules (a started address must be
   * completed) are checked against the merged result. Writes an audit event
   * listing changed field names only — never values.
   */
  async update(userId: string, patch: ProfilePatch): Promise<ProfileView> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
      const current = toRecord(user.profile);
      const next: ProfileRecord = { ...current };
      for (const key of PROFILE_TEXT_FIELDS) {
        const value = patch[key];
        if (value !== undefined) next[key] = value;
      }

      const issues = profileRecordIssues(next);
      if (issues.length > 0) {
        throw new ApiException("VALIDATION_FAILED", HttpStatus.BAD_REQUEST, "The request is invalid.", false, {
          fields: Object.fromEntries(issues.map((i) => [i.field, i.message])),
        });
      }

      const changed: ProfileTextField[] = PROFILE_TEXT_FIELDS.filter((k) => next[k] !== current[k]);
      const profile = await tx.customerProfile.upsert({
        where: { userId },
        create: { userId, ...next },
        update: next,
      });
      if (changed.length > 0 || !user.profile) {
        await tx.auditEvent.create({
          data: { actorUserId: userId, type: "PROFILE_UPDATED", meta: { fields: changed, created: !user.profile } },
        });
      }
      return toView(user, profile);
    });
  }
}

function toRecord(p: CustomerProfile | null): ProfileRecord {
  if (!p) return { ...EMPTY_PROFILE };
  return Object.fromEntries(PROFILE_TEXT_FIELDS.map((k) => [k, p[k]])) as ProfileRecord;
}

/**
 * Before the first save, suggest the provider-verified contacts so the
 * customer doesn't retype them. A contact counts as verified only while the
 * profile value equals the value the provider verified.
 */
export function toView(user: User, profile: CustomerProfile | null): ProfileView {
  const record = profile
    ? toRecord(profile)
    : {
        ...EMPTY_PROFILE,
        email: user.emailVerified ? user.email : null,
        phone: user.phoneVerified ? user.phone : null,
      };
  return {
    profile: record,
    verified: {
      email: user.emailVerified && user.email !== null && record.email?.toLowerCase() === user.email.toLowerCase(),
      phone: user.phoneVerified && user.phone !== null && record.phone === user.phone,
    },
    completeness: profileCompleteness(record),
    saved: profile !== null,
    updatedAt: profile?.updatedAt.toISOString() ?? null,
  };
}
