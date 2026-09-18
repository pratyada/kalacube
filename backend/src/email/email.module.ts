import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { join } from 'path';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    // Bull queue registration is kept so any legacy references still resolve,
    // but EmailService no longer uses it — transactional email is sent
    // synchronously (see email.service.ts) so no reachable Redis is required.
    BullModule.registerQueue({ name: 'email' }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // AWS SES transport via the SESv2 SDK. Credentials come from the default
        // provider chain (the Lambda execution role in prod) — no SMTP creds to
        // manage. nodemailer detects the `SES` key and drives SendEmailCommand.
        transport: {
          SES: {
            sesClient: new SESv2Client({
              region:
                config.get<string>('AWS_REGION') || 'ap-south-1',
            }),
            SendEmailCommand,
          },
        },
        defaults: {
          from:
            config.get<string>('EMAIL_FROM') ||
            'KalaCUBE <contact@kalacube.com>',
          // From (contact@) is a real Zoho inbox. Route every human reply to a
          // real inbox. Per-message replyTo (e.g. enquiry → buyer) overrides
          // this default.
          replyTo:
            config.get<string>('EMAIL_REPLY_TO') || 'contact@kalacube.com',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
