import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process()
  async sendMail(job: Job<any>) {
    try {
      await this.mailerService.sendMail(job.data);
      this.logger.log(`Email sent to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}`, error);
    }
  }
}
