import { IsIn } from 'class-validator';
import { FULFILMENT_STATUSES } from '../schemas/order.schema';
import type { FulfilmentStatus } from '../schemas/order.schema';

/** Artist/admin-scoped fulfilment status transition. */
export class UpdateStatusDto {
  @IsIn(FULFILMENT_STATUSES)
  status: FulfilmentStatus;
}
