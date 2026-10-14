-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ShareMethod" AS ENUM ('QR', 'CODE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'IN_REVIEW', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ConsentDecision" AS ENUM ('APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authSubject" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "logoUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "qrTtlMinutes" INTEGER NOT NULL DEFAULT 15,
    "defaultExplanation" VARCHAR(200),
    "dataContact" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareSession" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "purpose" VARCHAR(120) NOT NULL,
    "explanation" VARCHAR(200),
    "method" "ShareMethod" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'WAITING',
    "qrTokenHash" TEXT,
    "codeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "boundAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedField" (
    "sessionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "RequestedField_pkey" PRIMARY KEY ("sessionId","fieldKey")
);

-- CreateTable
CREATE TABLE "ConsentGrant" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "decision" "ConsentDecision" NOT NULL,
    "approvedKeys" TEXT[],
    "requestedKeys" TEXT[],
    "requiredKeys" TEXT[],
    "purposeSnapshot" TEXT NOT NULL,
    "orgNameSnapshot" TEXT NOT NULL,
    "consentTextVersion" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadCipher" BYTEA,
    "payloadKeyId" TEXT,
    "hiddenByCustomerAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceGrantId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "createdById" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "organizationId" TEXT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "ipHash" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authSubject_key" ON "User"("authSubject");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_status_idx" ON "Invitation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Invitation_email_status_idx" ON "Invitation"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ShareSession_reference_key" ON "ShareSession"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ShareSession_qrTokenHash_key" ON "ShareSession"("qrTokenHash");

-- CreateIndex
CREATE INDEX "ShareSession_organizationId_status_createdAt_idx" ON "ShareSession"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShareSession_organizationId_createdAt_idx" ON "ShareSession"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareSession_customerId_status_idx" ON "ShareSession"("customerId", "status");

-- CreateIndex
CREATE INDEX "ShareSession_status_expiresAt_idx" ON "ShareSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentGrant_receiptId_key" ON "ConsentGrant"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentGrant_sessionId_key" ON "ConsentGrant"("sessionId");

-- CreateIndex
CREATE INDEX "ConsentGrant_customerId_createdAt_idx" ON "ConsentGrant"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentGrant_organizationId_createdAt_idx" ON "ConsentGrant"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRecord_sourceGrantId_key" ON "CustomerRecord"("sourceGrantId");

-- CreateIndex
CREATE INDEX "CustomerRecord_organizationId_fullName_idx" ON "CustomerRecord"("organizationId", "fullName");

-- CreateIndex
CREATE INDEX "CustomerRecord_organizationId_email_idx" ON "CustomerRecord"("organizationId", "email");

-- CreateIndex
CREATE INDEX "CustomerRecord_organizationId_phone_idx" ON "CustomerRecord"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "CustomerRecord_organizationId_createdAt_idx" ON "CustomerRecord"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_at_idx" ON "AuditEvent"("organizationId", "at");

-- CreateIndex
CREATE INDEX "AuditEvent_sessionId_at_idx" ON "AuditEvent"("sessionId", "at");

-- CreateIndex
CREATE INDEX "AuditEvent_type_at_idx" ON "AuditEvent"("type", "at");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowEndsAt_idx" ON "RateLimitBucket"("windowEndsAt");

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareSession" ADD CONSTRAINT "ShareSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareSession" ADD CONSTRAINT "ShareSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareSession" ADD CONSTRAINT "ShareSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedField" ADD CONSTRAINT "RequestedField_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ShareSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentGrant" ADD CONSTRAINT "ConsentGrant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ShareSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentGrant" ADD CONSTRAINT "ConsentGrant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRecord" ADD CONSTRAINT "CustomerRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRecord" ADD CONSTRAINT "CustomerRecord_sourceGrantId_fkey" FOREIGN KEY ("sourceGrantId") REFERENCES "ConsentGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRecord" ADD CONSTRAINT "CustomerRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Hand-written constraints (not expressible in Prisma schema) ───────────────

-- At most one WAITING session per share-code hash. Codes are regenerated on collision.
CREATE UNIQUE INDEX "ShareSession_active_codeHash_key"
  ON "ShareSession" ("codeHash")
  WHERE "status" = 'WAITING' AND "codeHash" IS NOT NULL;

-- Defence in depth: only allowlisted field keys (mirror of packages/shared FIELD_KEYS).
ALTER TABLE "RequestedField"
  ADD CONSTRAINT "RequestedField_fieldKey_allowlist"
  CHECK ("fieldKey" IN ('FULL_NAME', 'MOBILE', 'EMAIL', 'ADDRESS'));

-- A QR session carries a token hash and no code hash, and vice versa.
ALTER TABLE "ShareSession"
  ADD CONSTRAINT "ShareSession_method_secret"
  CHECK (("method" = 'QR' AND "codeHash" IS NULL) OR ("method" = 'CODE' AND "qrTokenHash" IS NULL));

-- Approved keys must be a subset of requested keys; declined grants carry no payload.
ALTER TABLE "ConsentGrant"
  ADD CONSTRAINT "ConsentGrant_approved_subset" CHECK ("approvedKeys" <@ "requestedKeys"),
  ADD CONSTRAINT "ConsentGrant_required_subset" CHECK ("decision" <> 'APPROVED' OR "requiredKeys" <@ "approvedKeys"),
  ADD CONSTRAINT "ConsentGrant_declined_empty"
    CHECK ("decision" <> 'DECLINED' OR (cardinality("approvedKeys") = 0 AND "payloadCipher" IS NULL));

-- Organization TTL bounds (PROMPT.md §9.1).
ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_qrTtl_range" CHECK ("qrTtlMinutes" BETWEEN 5 AND 30);
