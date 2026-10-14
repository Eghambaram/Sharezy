import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import type { AppConfig } from "./config/env.js";

/** Shared app wiring for main.ts and integration tests. */
export function configureApp(app: INestApplication, config: AppConfig): void {
  app.use(helmet());
  // Responses may carry personal data: never let browsers or proxies cache them.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.enableCors({
    origin: config.APP_ORIGIN,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "X-Org-Id", "Idempotency-Key"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
  app.setGlobalPrefix("v1", { exclude: ["health", "ready"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Never echo submitted values back in validation errors.
      validationError: { target: false, value: false },
    }),
  );

  const doc = new DocumentBuilder()
    .setTitle("DataExchange API")
    .setDescription(
      "Field-level, consented personal data sharing. Errors use the envelope `{ error: { code, message, retryable } }`.",
    )
    .setVersion("0.1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", in: "header", name: "X-Org-Id" }, "org")
    .build();
  SwaggerModule.setup("docs", app, () => SwaggerModule.createDocument(app, doc));
}
