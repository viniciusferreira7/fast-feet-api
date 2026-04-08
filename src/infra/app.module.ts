import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CryptographyModule } from './cryptography/cryptography.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { envSchema } from './env/env';
import { EnvModule } from './env/env.module';
import { HttpModule } from './http/http.module';
import { StorageModule } from './storage/storage.module';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    AuthModule,
    CryptographyModule,
    EmailModule,
    EnvModule,
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.test', '.env'],
      validate: (env) => {
        return envSchema.parse(env);
      },
      isGlobal: true,
    }),
    ValidationModule,
    StorageModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
