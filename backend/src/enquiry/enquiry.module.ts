import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enquiry, EnquirySchema } from './schemas/enquiry.schema';
import { EnquiryController } from './enquiry.controller';
import { EnquiryService } from './enquiry.service';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';

/**
 * Buyer→artist enquiry / buy-intent lead capture. Public POST creates a lead
 * and emails both parties (via EmailService/SES); authed artist endpoints list
 * and manage their own enquiries.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Enquiry.name, schema: EnquirySchema }]),
    UserModule,
    EmailModule,
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService],
})
export class EnquiryModule {}
