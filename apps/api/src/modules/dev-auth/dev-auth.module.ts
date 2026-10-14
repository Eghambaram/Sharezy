import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { DevAuthController, DevOnlyGuard } from "./dev-auth.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [DevAuthController],
  providers: [DevOnlyGuard],
})
export class DevAuthModule {}
