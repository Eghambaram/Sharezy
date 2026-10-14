import { Injectable, Logger } from "@nestjs/common";
import type { Me } from "@dx/shared";
import { Prisma, type User } from "../../generated/prisma/client.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthProvider, ProviderContacts } from "../auth/auth-provider.js";

/** How long provider contact details are trusted before re-fetching. */
export const CONTACT_SYNC_INTERVAL_MS = 15 * 60_000;

@Injectable()
export class UsersService {
  private readonly logger = new Logger("Users");

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the local user for a verified provider subject, creating it on
   * first sight. Deleted accounts resolve to null (→ 401). Contact details are
   * refreshed from the provider at most every CONTACT_SYNC_INTERVAL_MS.
   */
  async resolveFromProvider(subject: string, provider: AuthProvider, now = new Date()): Promise<User | null> {
    let user = await this.prisma.user.findUnique({ where: { authSubject: subject } });
    if (user?.deletedAt) return null;
    if (!user) user = await this.createUser(subject);

    const stale = !user.lastSyncedAt || now.getTime() - user.lastSyncedAt.getTime() > CONTACT_SYNC_INTERVAL_MS;
    if (stale) {
      const contacts = await provider.fetchContacts(subject);
      if (contacts) user = await this.applyContacts(user, contacts, now);
    }
    return user;
  }

  private async createUser(subject: string): Promise<User> {
    try {
      const user = await this.prisma.user.create({ data: { authSubject: subject } });
      await this.prisma.auditEvent.create({ data: { actorUserId: user.id, type: "USER_CREATED", meta: {} } });
      this.logger.log({ msg: "user_created", userId: user.id });
      return user;
    } catch (e) {
      // Two first requests raced; the other one created it.
      if (isUniqueViolation(e)) {
        const existing = await this.prisma.user.findUnique({ where: { authSubject: subject } });
        if (existing) return existing;
      }
      throw e;
    }
  }

  /**
   * Stores only provider-verified email/phone (unique columns). An unverified
   * value, or one already linked to another account, is not stored, so nobody
   * can claim someone else's address by typing it.
   */
  private async applyContacts(user: User, c: ProviderContacts, now: Date): Promise<User> {
    const email = c.email && c.emailVerified ? await this.unclaimed("email", c.email, user.id) : null;
    const phone = c.phone && c.phoneVerified ? await this.unclaimed("phone", c.phone, user.id) : null;
    try {
      return await this.prisma.user.update({
        where: { id: user.id },
        data: { email, emailVerified: email !== null, phone, phoneVerified: phone !== null, lastSyncedAt: now },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      this.logger.warn({ msg: "contact_conflict", userId: user.id });
      return this.prisma.user.update({ where: { id: user.id }, data: { lastSyncedAt: now } });
    }
  }

  private async unclaimed(field: "email" | "phone", value: string, userId: string): Promise<string | null> {
    const other = await this.prisma.user.findFirst({ where: { [field]: value, NOT: { id: userId } }, select: { id: true } });
    if (other) {
      this.logger.warn({ msg: "contact_conflict", userId });
      return null;
    }
    return value;
  }

  async getMe(userId: string): Promise<Me | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          where: { organization: { deletedAt: null } },
          include: { organization: { select: { name: true, isSample: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      // Only provider-verified values are ever exposed as account contacts.
      email: user.emailVerified ? user.email : null,
      emailVerified: user.emailVerified && user.email !== null,
      phone: user.phoneVerified ? user.phone : null,
      phoneVerified: user.phoneVerified && user.phone !== null,
      isSample: user.isSample,
      memberships: user.memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        role: m.role,
        isSample: m.organization.isSample,
      })),
    };
  }
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
