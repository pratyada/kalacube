import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendEmail(data: any, opts?: any) {
    try {
      await this.emailQueue.add(data, opts);
    } catch (error) {
      this.logger.error('Failed to queue email', error);
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to kalaCUBE!',
      template: 'welcome',
      context: { firstName },
    });
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
    clientUrl: string,
  ) {
    await this.sendEmail({
      to: email,
      subject: 'Verify your kalaCUBE email',
      template: 'verify-email',
      context: {
        firstName,
        verificationUrl: `${clientUrl}/auth/verify-email?token=${token}`,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
    clientUrl: string,
  ) {
    await this.sendEmail({
      to: email,
      subject: 'Reset your kalaCUBE password',
      template: 'reset-password',
      context: {
        firstName,
        resetUrl: `${clientUrl}/auth/reset-password?token=${token}`,
      },
    });
  }
}
