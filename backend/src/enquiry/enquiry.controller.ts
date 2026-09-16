import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/enquiries')
export class EnquiryController {
  constructor(private readonly enquiry: EnquiryService) {}

  /** Public buyer → artist lead capture. No auth. */
  @Public()
  @Post()
  create(@Body() dto: CreateEnquiryDto) {
    return this.enquiry.create(dto);
  }

  /** The signed-in artist's own enquiries (newest first) + status counts. */
  @Get('mine')
  mine(@CurrentUser('_id') userId: string) {
    return this.enquiry.listMine(userId?.toString());
  }

  /** Owner-artist marks an enquiry read/closed. */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateEnquiryDto,
  ) {
    return this.enquiry.updateStatus(id, userId?.toString(), dto.status);
  }
}
