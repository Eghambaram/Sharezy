import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { devTokenSchema, devUsersSchema, meSchema } from "@dx/shared";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/bootstrap.js";
import { loadConfig } from "../src/config/env.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { DevAuthProvider } from "../src/modules/auth/dev-auth-provider.js";

describe("auth (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const config = loadConfig();
  const dev = new DevAuthProvider(config.DEV_JWT_SECRET ?? "");
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, config);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.auditEvent.deleteMany();
    await prisma.customerRecord.deleteMany();
    await prisma.consentGrant.deleteMany();
    await prisma.shareSession.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("health stays public", async () => {
    await http().get("/health").expect(200);
  });

  it("rejects missing, malformed, and forged tokens with the error envelope", async () => {
    const expected = { error: { code: "UNAUTHENTICATED", message: "Sign in to continue.", retryable: false } };
    const noToken = await http().get("/v1/me").expect(401);
    expect(noToken.body).toEqual(expected);
    expect(noToken.headers["cache-control"]).toBe("no-store");

    await http().get("/v1/me").set("Authorization", "Bearer not-a-jwt").expect(401);
    await http().get("/v1/me").set("Authorization", "Basic abc").expect(401);

    const forged = await new DevAuthProvider("f".repeat(48)).issue("dev-alex-morgan");
    const res = await http().get("/v1/me").set("Authorization", `Bearer ${forged.token}`).expect(401);
    expect(res.body).toEqual(expected);
  });

  it("rejects expired tokens", async () => {
    const { token } = await dev.issue("dev-someone", -5);
    await http().get("/v1/me").set("Authorization", `Bearer ${token}`).expect(401);
  });

  it("creates the local user on first valid request, once", async () => {
    const { token } = await dev.issue("dev-first-timer");
    const [a, b] = await Promise.all([
      http().get("/v1/me").set("Authorization", `Bearer ${token}`),
      http().get("/v1/me").set("Authorization", `Bearer ${token}`),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const me = meSchema.parse(a.body);
    expect(me).toMatchObject({ email: null, emailVerified: false, phone: null, phoneVerified: false, memberships: [] });
    expect(await prisma.user.count({ where: { authSubject: "dev-first-timer" } })).toBe(1);
    expect(await prisma.auditEvent.count({ where: { type: "USER_CREATED" } })).toBe(1);
  });

  it("returns memberships for business users", async () => {
    const user = await prisma.user.create({ data: { authSubject: "dev-owner" } });
    await prisma.organization.create({
      data: { name: "Test Org", category: "Retail", memberships: { create: { userId: user.id, role: "OWNER" } } },
    });
    const { token } = await dev.issue("dev-owner");
    const res = await http().get("/v1/me").set("Authorization", `Bearer ${token}`).expect(200);
    expect(meSchema.parse(res.body).memberships).toEqual([
      expect.objectContaining({ organizationName: "Test Org", role: "OWNER" }),
    ]);
  });

  it("never exposes unverified contact values", async () => {
    await prisma.user.create({ data: { authSubject: "dev-unverified", phone: "+919876500000", email: "u@example.com" } });
    const { token } = await dev.issue("dev-unverified");
    const me = meSchema.parse((await http().get("/v1/me").set("Authorization", `Bearer ${token}`).expect(200)).body);
    expect(me).toMatchObject({ phone: null, phoneVerified: false, email: null, emailVerified: false });
  });

  it("treats deleted accounts as signed out", async () => {
    await prisma.user.create({ data: { authSubject: "dev-gone", deletedAt: new Date() } });
    const { token } = await dev.issue("dev-gone");
    await http().get("/v1/me").set("Authorization", `Bearer ${token}`).expect(401);
  });

  describe("dev-auth", () => {
    it("lists only synthetic dev users and issues working tokens", async () => {
      const sample = await prisma.user.create({
        data: { authSubject: "dev-sample", isSample: true, profile: { create: { firstName: "Sam", lastName: "Ple" } } },
      });
      await prisma.user.create({ data: { authSubject: "user_real", isSample: false } });

      const list = devUsersSchema.parse((await http().get("/v1/dev-auth/users").expect(200)).body);
      expect(list).toEqual([{ id: sample.id, displayName: "Sam Ple", kind: "customer", organizationName: null }]);

      const issued = devTokenSchema.parse((await http().post("/v1/dev-auth/token").send({ userId: sample.id }).expect(200)).body);
      const me = meSchema.parse((await http().get("/v1/me").set("Authorization", `Bearer ${issued.token}`).expect(200)).body);
      expect(me.id).toBe(sample.id);
    });

    it("refuses tokens for non-synthetic users and rejects extra fields", async () => {
      const real = await prisma.user.create({ data: { authSubject: "user_real", isSample: false } });
      await http().post("/v1/dev-auth/token").send({ userId: real.id }).expect(404);
      await http().post("/v1/dev-auth/token").send({ userId: real.id, admin: true }).expect(400);
    });

    it("creates a fresh synthetic user for first sign-in testing", async () => {
      const issued = devTokenSchema.parse((await http().post("/v1/dev-auth/users").send({ kind: "customer" }).expect(201)).body);
      const me = meSchema.parse((await http().get("/v1/me").set("Authorization", `Bearer ${issued.token}`).expect(200)).body);
      expect(me.isSample).toBe(true);
    });
  });
});
