import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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

  /** The signed-in artist's own sales. */
  @Get('mine')
  mine(@CurrentUser('_id') userId: string) {
    return this.orders.listMine(userId?.toString());
  }

  /** Public order + tracking (buyer tracking view; id is the capability). */
  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.orders.getOne(id);
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
