import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { APP_CONFIG } from "../../config/config.module.js";
import type { AppConfig } from "../../config/env.js";
import { UsersModule } from "../users/users.module.js";
import { AUTH_PROVIDER, type AuthProvider } from "./auth-provider.js";
import { AuthGuard } from "./auth.guard.js";
import { ClerkAuthProvider, createClerkJwks } from "./clerk-auth-provider.js";
import { DevAuthProvider } from "./dev-auth-provider.js";

export function createAuthProvider(config: AppConfig): AuthProvider {
  if (config.AUTH_MODE === "dev") {
    // Belt and braces: env validation already refuses this combination.
    if (config.NODE_ENV === "production") throw new Error("Dev auth is not allowed in production");
    if (!config.DEV_JWT_SECRET) throw new Error("DEV_JWT_SECRET is required in dev auth mode");
    return new DevAuthProvider(config.DEV_JWT_SECRET);
  }
  if (!config.CLERK_JWKS_URL || !config.CLERK_ISSUER || !config.CLERK_SECRET_KEY) {
    throw new Error("Clerk configuration is incomplete");
  }
  return new ClerkAuthProvider({
    issuer: config.CLERK_ISSUER,
    ...(config.CLERK_AUDIENCE ? { audience: config.CLERK_AUDIENCE } : {}),
    authorizedParties: [config.APP_ORIGIN],
    secretKey: config.CLERK_SECRET_KEY,
    jwks: createClerkJwks(config.CLERK_JWKS_URL),
  });
}

@Module({
  imports: [UsersModule],
  providers: [
    { provide: AUTH_PROVIDER, inject: [APP_CONFIG], useFactory: createAuthProvider },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH_PROVIDER],
})
export class AuthModule {}
