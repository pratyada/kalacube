import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Public checkout — create an order from artwork id(s) + buyer info. */
  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  /**
   * Public payment confirmation — mark paid, advance the state machine, create
   * the shipment. In stub mode this succeeds without a real charge (test mode).
   */
  @Public()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body() dto: ConfirmOrderDto) {
    return this.orders.confirm(id, dto);
  }

  /**
   * Courier tracking webhook (Shiprocket). Public, but authenticated by a shared
   * secret in the `x-api-key` header. NOTE: the path deliberately avoids the
   * words "shiprocket"/"sr"/"kr" — Shiprocket rejects webhook URLs containing
   * its own name ("Address is not allowed").
   */
  @Public()
  @Post('webhook/courier')
  shiprocketWebhook(
    @Body() body: any,
    @Headers('x-api-key') token: string,
  ) {
    return this.orders.handleShiprocketWebhook(body, token);
  }

  /** The signed-in artist's own sales. */
  @Get('mine')
  mine(@CurrentUser('_id') userId: string) {
    return this.orders.listMine(userId?.toString());
  }

  /**
   * Public order tracking. `ref` is the order's random `publicToken` (a
   * capability), NOT the Mongo _id — so buyer PII can't be reached by guessing
   * ids. The response is a PII-stripped tracking view.
   */
  @Public()
  @Get(':ref')
  getOne(@Param('ref') ref: string) {
    return this.orders.getPublicTracking(ref);
  }

  /** Artist/admin-scoped fulfilment status transition. */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.orders.updateStatus(id, user, dto.status);
  }
}
