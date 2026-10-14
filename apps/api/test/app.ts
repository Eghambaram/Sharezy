import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/bootstrap.js";
import { loadConfig } from "../src/config/env.js";
import { DevAuthProvider } from "../src/modules/auth/dev-auth-provider.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
  /** Bearer header value for a dev subject. */
  bearer: (subject: string) => Promise<string>;
  /** Removes all rows (test database only). */
  reset: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const config = loadConfig();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app, config);
  await app.init();
  const prisma = app.get(PrismaService);
  const dev = new DevAuthProvider(config.DEV_JWT_SECRET ?? "");
  return {
    app,
    prisma,
    http: () => request(app.getHttpServer()),
    bearer: async (subject) => `Bearer ${(await dev.issue(subject)).token}`,
    reset: async () => {
      await prisma.auditEvent.deleteMany();
      await prisma.customerRecord.deleteMany();
      await prisma.consentGrant.deleteMany();
      await prisma.shareSession.deleteMany();
      await prisma.membership.deleteMany();
      await prisma.organization.deleteMany();
      await prisma.user.deleteMany();
    },
  };
}
