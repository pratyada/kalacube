import { IsIn } from 'class-validator';

/** Artist-side status transition for an enquiry. */
export class UpdateEnquiryDto {
  @IsIn(['new', 'read', 'closed'])
  status: 'new' | 'read' | 'closed';
}
