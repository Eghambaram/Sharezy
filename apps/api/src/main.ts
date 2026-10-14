import "reflect-metadata";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApp } from "./bootstrap.js";
import { ConfigError, loadConfig } from "./config/env.js";
import { JsonLogger } from "./common/logging/json-logger.js";

// Local dev: read the repo-root .env. Deployed environments inject variables directly.
const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnv)) loadDotenv({ path: rootEnv, quiet: true });

const logger = new JsonLogger();

async function bootstrap(): Promise<void> {
  // Validate before Nest starts so misconfiguration (e.g. AUTH_MODE=dev in production) refuses to boot.
  const config = loadConfig();

  const app = await NestFactory.create(AppModule, { logger, bufferLogs: true });
  configureApp(app, config);
  app.enableShutdownHooks();
  await app.listen(config.API_PORT);

  logger.log({ msg: "api_listening", port: config.API_PORT, authMode: config.AUTH_MODE, env: config.NODE_ENV }, "Bootstrap");
}

try {
  await bootstrap();
} catch (err) {
  if (err instanceof ConfigError) {
    process.stderr.write(`\n${err.message}\n\n`);
  } else {
    logger.error({ msg: "bootstrap_failed", errorName: err instanceof Error ? err.name : typeof err }, undefined, "Bootstrap");
  }
  process.exit(1);
}
