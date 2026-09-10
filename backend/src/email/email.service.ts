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

  /**
   * Queue a branded newsletter to many recipients. Each recipient becomes its
   * own job on the 'email' queue (template: 'newsletter'). Returns how many were
   * queued. Callers are responsible for segment resolution + safety caps.
   */
  async sendNewsletter(
    recipients: { email: string; firstName?: string }[],
    payload: { subject: string; bodyHtml: string; clientUrl?: string },
  ): Promise<number> {
    const clientUrl = payload.clientUrl || 'https://kalacube.com';
    let queued = 0;
    for (const r of recipients) {
      if (!r?.email) continue;
      await this.sendEmail({
        to: r.email,
        subject: payload.subject,
        template: 'newsletter',
        context: {
          subject: payload.subject,
          bodyHtml: payload.bodyHtml,
          firstName: r.firstName || 'there',
          unsubscribeUrl: `${clientUrl}/unsubscribe?email=${encodeURIComponent(r.email)}`,
        },
      });
      queued += 1;
    }
    return queued;
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
