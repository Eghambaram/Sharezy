import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "./config/config.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ErrorEnvelopeFilter } from "./common/errors/error-envelope.filter.js";
import { HealthController } from "./modules/health/health.controller.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { DevAuthModule } from "./modules/dev-auth/dev-auth.module.js";
import { ProfilesModule } from "./modules/profiles/profiles.module.js";
import { ConsentModule } from "./modules/consent/consent.module.js";

@Module({
  imports: [ConfigModule, PrismaModule, ScheduleModule.forRoot(), AuthModule, UsersModule, ProfilesModule, ConsentModule, DevAuthModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ErrorEnvelopeFilter }],
})
export class AppModule {}
