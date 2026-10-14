/**
 * Synthetic demo data (PROMPT.md §15). Everything is flagged `isSample` and the
 * UI labels it "Sample data". Emails use example.com only.
 *
 * Honesty rules applied here:
 *  - No organization gets `verifiedAt` (no real verification process exists).
 *  - No contact is marked verified (no OTP or provider verification happened), and
 *    User.email/phone stay null: those columns hold provider-verified values only.
 *    Contact details live on the profile.
 *  - Pending sessions get random tokens/codes whose plaintext is discarded, exactly
 *    as the API does after returning them once. They cannot be redeemed.
 *
 * Re-running the seed deletes previous sample data first.
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { CONSENT_TEXT_VERSION, FIELD_KEYS, type FieldKey } from "@dx/shared";
import { PrismaClient, type SessionStatus, type ShareMethod } from "../src/generated/prisma/client.js";
import { loadConfig } from "../src/config/env.js";
import { encryptPayload, parseKey } from "../src/common/crypto/payload-cipher.js";
import {
  generateQrToken,
  generateReceiptId,
  generateReference,
  generateShareCode,
  hashQrToken,
  hashShareCode,
} from "../src/common/crypto/secrets.js";

loadEnv({ path: "../../.env", quiet: true });
const config = loadConfig();
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.DATABASE_URL }) });
const encKey = parseKey(config.DATA_ENC_KEY_ID, config.DATA_ENC_KEY);

const now = Date.now();
const minutes = (n: number): Date => new Date(now + n * 60_000);
const daysAgo = (d: number, h = 10): Date => new Date(now - d * 86_400_000 - h * 3_600_000);

interface SampleCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

function profileValue(c: SampleCustomer, key: FieldKey): unknown {
  switch (key) {
    case "FULL_NAME":
      return `${c.firstName} ${c.lastName}`;
    case "MOBILE":
      return c.phone;
    case "EMAIL":
      return c.email;
    case "ADDRESS":
      return { line1: c.addressLine1, city: c.city, region: c.region, postalCode: c.postalCode, country: c.country };
  }
}

async function main(): Promise<void> {
  // ── Reset previous sample data ────────────────────────────────────────────
  // Records first: they reference grants with ON DELETE RESTRICT.
  await prisma.customerRecord.deleteMany({ where: { organization: { isSample: true } } });
  await prisma.organization.deleteMany({ where: { isSample: true } });
  await prisma.user.deleteMany({ where: { isSample: true } });

  // ── Users ─────────────────────────────────────────────────────────────────
  const ramesh = await prisma.user.create({
    data: {
      authSubject: "dev-ramesh-kumar",
      isSample: true,
      profile: { create: { firstName: "Ramesh", lastName: "Kumar", email: "ramesh.kumar@example.com" } },
    },
  });

  const alexData = {
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@example.com",
    phone: "+919876543210",
    addressLine1: "14 Lakeview Road",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    country: "IN",
  };
  const alexUser = await prisma.user.create({
    data: {
      authSubject: "dev-alex-morgan",
      isSample: true,
      profile: { create: alexData },
    },
  });
  const alex: SampleCustomer = { id: alexUser.id, ...alexData };

  const johnData = {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+14165550123",
    addressLine1: "220 King Street West",
    city: "Toronto",
    region: "ON",
    postalCode: "M5H 1K4",
    country: "CA",
  };
  const johnUser = await prisma.user.create({
    data: {
      authSubject: "dev-john-smith",
      isSample: true,
      profile: { create: johnData },
    },
  });
  const john: SampleCustomer = { id: johnUser.id, ...johnData };

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: "Maple Grove Properties",
      category: "Property management",
      contactEmail: "office@maplegrove.example.com",
      dataContact: "privacy@maplegrove.example.com",
      isSample: true,
      memberships: { create: { userId: ramesh.id, role: "OWNER" } },
    },
  });

  // ── Sessions ──────────────────────────────────────────────────────────────
  interface Spec {
    name: string;
    purpose: string;
    method: ShareMethod;
    status: SessionStatus;
    createdAt: Date;
    fields: { key: FieldKey; required: boolean }[];
    customer?: SampleCustomer;
    approved?: FieldKey[];
  }

  const visitorFields = [
    { key: "FULL_NAME", required: true },
    { key: "MOBILE", required: true },
    { key: "EMAIL", required: false },
  ] satisfies Spec["fields"];
  const allFields = FIELD_KEYS.map((key) => ({ key, required: key === "FULL_NAME" || key === "MOBILE" }));

  const specs: Spec[] = [
    { name: "Visitor Registration", purpose: "Building visitor log", method: "QR", status: "COMPLETED", createdAt: daysAgo(1, 2), fields: visitorFields, customer: alex, approved: ["FULL_NAME", "MOBILE", "EMAIL"] },
    { name: "Tenant Application", purpose: "Rental application", method: "QR", status: "WAITING", createdAt: new Date(now - 60_000), fields: allFields },
    { name: "Service Appointment", purpose: "Maintenance visit scheduling", method: "CODE", status: "COMPLETED", createdAt: daysAgo(2), fields: allFields, customer: john, approved: ["FULL_NAME", "MOBILE", "ADDRESS"] },
    { name: "Open House Registration", purpose: "Open house attendance", method: "QR", status: "DECLINED", createdAt: daysAgo(3), fields: visitorFields, customer: john },
    { name: "Parking Permit", purpose: "Visitor parking permit", method: "CODE", status: "EXPIRED", createdAt: daysAgo(4), fields: visitorFields },
    { name: "Move-in Inspection", purpose: "Move-in inspection booking", method: "QR", status: "CANCELLED", createdAt: daysAgo(5), fields: allFields },
    { name: "Visitor Registration", purpose: "Building visitor log", method: "CODE", status: "APPROVED", createdAt: daysAgo(0, 1), fields: visitorFields, customer: alex, approved: ["FULL_NAME", "MOBILE"] },
    { name: "Amenity Booking", purpose: "Clubhouse booking", method: "QR", status: "COMPLETED", createdAt: daysAgo(9), fields: visitorFields, customer: alex, approved: ["FULL_NAME", "MOBILE", "EMAIL"] },
  ];

  for (const s of specs) {
    const isPending = s.status === "WAITING" || s.status === "IN_REVIEW";
    const expiresAt = isPending
      ? minutes(s.method === "QR" ? config.QR_TTL_MINUTES : config.CODE_TTL_MINUTES)
      : new Date(s.createdAt.getTime() + 15 * 60_000);
    const decidedAt = s.customer ? new Date(s.createdAt.getTime() + 3 * 60_000) : null;

    const session = await prisma.shareSession.create({
      data: {
        reference: generateReference(),
        organizationId: org.id,
        createdById: ramesh.id,
        name: s.name,
        purpose: s.purpose,
        method: s.method,
        status: s.status,
        // Plaintext discarded immediately — same as the real API after returning it once.
        qrTokenHash: s.method === "QR" ? hashQrToken(generateQrToken()) : null,
        codeHash: s.method === "CODE" ? hashShareCode(generateShareCode(), config.SHARE_CODE_PEPPER) : null,
        expiresAt,
        customerId: s.customer?.id ?? null,
        boundAt: s.customer ? new Date(s.createdAt.getTime() + 60_000) : null,
        decidedAt,
        cancelledAt: s.status === "CANCELLED" ? new Date(s.createdAt.getTime() + 2 * 60_000) : null,
        completedAt: s.status === "COMPLETED" ? new Date(s.createdAt.getTime() + 5 * 60_000) : null,
        isSample: true,
        createdAt: s.createdAt,
        fields: { create: s.fields.map((f) => ({ fieldKey: f.key, required: f.required })) },
      },
    });

    await prisma.auditEvent.create({
      data: { organizationId: org.id, sessionId: session.id, actorUserId: ramesh.id, type: "SESSION_CREATED", at: s.createdAt, meta: { method: s.method, fieldKeys: s.fields.map((f) => f.key) } },
    });

    if (!s.customer || !decidedAt) continue;

    const approved = s.status === "DECLINED" ? [] : (s.approved ?? []);
    const grantId = `sample_grant_${session.id}`;
    const payload = Object.fromEntries(approved.map((k) => [k, profileValue(s.customer as SampleCustomer, k)]));

    await prisma.consentGrant.create({
      data: {
        id: grantId,
        receiptId: generateReceiptId(),
        sessionId: session.id,
        customerId: s.customer.id,
        organizationId: org.id,
        decision: s.status === "DECLINED" ? "DECLINED" : "APPROVED",
        approvedKeys: approved,
        requestedKeys: s.fields.map((f) => f.key),
        requiredKeys: s.fields.filter((f) => f.required).map((f) => f.key),
        purposeSnapshot: s.purpose,
        orgNameSnapshot: org.name,
        consentTextVersion: CONSENT_TEXT_VERSION,
        idempotencyKey: crypto.randomUUID(),
        payloadCipher: approved.length > 0 ? encryptPayload(payload, encKey, grantId) : null,
        payloadKeyId: approved.length > 0 ? encKey.id : null,
        isSample: true,
        createdAt: decidedAt,
      },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        sessionId: session.id,
        actorUserId: s.customer.id,
        type: s.status === "DECLINED" ? "CONSENT_DECLINED" : "CONSENT_APPROVED",
        at: decidedAt,
        meta: { grantId, approvedKeys: approved },
      },
    });

    if (s.status === "COMPLETED") {
      const address = approved.includes("ADDRESS") ? (profileValue(s.customer, "ADDRESS") as object) : undefined;
      const record = await prisma.customerRecord.create({
        data: {
          organizationId: org.id,
          sourceGrantId: grantId,
          fullName: approved.includes("FULL_NAME") ? `${s.customer.firstName} ${s.customer.lastName}` : null,
          email: approved.includes("EMAIL") ? s.customer.email : null,
          phone: approved.includes("MOBILE") ? s.customer.phone : null,
          ...(address ? { address } : {}),
          createdById: ramesh.id,
          isSample: true,
        },
      });
      await prisma.auditEvent.create({
        data: { organizationId: org.id, sessionId: session.id, actorUserId: ramesh.id, type: "RECORD_SAVED", meta: { recordId: record.id, grantId } },
      });
    }
  }

  const counts = {
    users: await prisma.user.count({ where: { isSample: true } }),
    sessions: await prisma.shareSession.count({ where: { isSample: true } }),
    grants: await prisma.consentGrant.count({ where: { isSample: true } }),
    records: await prisma.customerRecord.count({ where: { isSample: true } }),
  };
  process.stdout.write(`Seeded sample data: ${JSON.stringify(counts)}\n`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
