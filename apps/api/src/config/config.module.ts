import { Global, Inject, Module } from "@nestjs/common";
import { loadConfig, type AppConfig } from "./env.js";

export const APP_CONFIG = Symbol("APP_CONFIG");

/** Injects the validated AppConfig: `constructor(@InjectConfig() cfg: AppConfig)`. */
export const InjectConfig = (): ParameterDecorator => Inject(APP_CONFIG);

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: (): AppConfig => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
