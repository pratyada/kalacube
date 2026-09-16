import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { configValidationSchema } from './config/config.schema';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { CognitoModule } from './auth/cognito/cognito.module';
import { UserModule } from './user/user.module';
import { ExploreModule } from './explore/explore.module';
import { AdminModule } from './admin/admin.module';
import { ArtworkModule } from './artwork/artwork.module';
import { S3Module } from './s3/s3.module';
import { EmailModule } from './email/email.module';
import { EmailTrackingModule } from './email-tracking/email-tracking.module';
import { EnquiryModule } from './enquiry/enquiry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        // Lambda-friendly connection reuse: keep bufferCommands on so queries
        // that arrive during a cold-start connect are buffered (not thrown),
        // and hold a small pool open across warm invocations rather than
        // opening a new connection per request. Nest caches this connection as
        // a singleton, which the module-level app cache in lambda.ts reuses.
        bufferCommands: true,
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Serverless Redis (e.g. Upstash) needs TLS + an auth password; local
        // dev Redis needs neither. Both are opt-in via env so the existing
        // local Bull path is untouched when the flags are absent.
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        const useTls =
          String(config.get('REDIS_TLS')).toLowerCase() === 'true';
        return {
          redis: {
            host: config.get('REDIS_HOST'),
            port: config.get('REDIS_PORT'),
            ...(password ? { password } : {}),
            ...(useTls ? { tls: {} } : {}),
          },
        };
      },
    }),
    CognitoModule,
    AuthModule,
    UserModule,
    ExploreModule,
    AdminModule,
    ArtworkModule,
    S3Module,
    EmailModule,
    EmailTrackingModule,
    EnquiryModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
