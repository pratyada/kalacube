import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Order, OrderSchema } from './schemas/order.schema';
import { Artwork, ArtworkSchema } from '../explore/schemas/artwork.schema';
import { OrdersController } from './orders.controller';
import {
  OrdersService,
  PAYMENT_ADAPTER,
  POD_ADAPTER,
  LOGISTICS_ADAPTER,
  PAYOUT_ADAPTER,
} from './orders.service';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { createPaymentAdapter } from './adapters/payment.adapter';
import { createPodAdapter } from './adapters/pod.adapter';
import { createLogisticsAdapter } from './adapters/logistics.adapter';
import { createPayoutAdapter } from './adapters/payout.adapter';

/**
 * Selling + fulfilment engine. Public checkout creates a held-payment order and
 * emails buyer + artist; confirm advances the fulfilment state machine and
 * creates the shipment; authed artist endpoints list/manage sales.
 *
 * Every external integration (Razorpay payments/Route, Qikink POD, Shiprocket
 * logistics) sits behind an env-gated adapter that runs in STUB mode when its
 * keys are absent — so deploying with no keys is 100% safe.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Artwork.name, schema: ArtworkSchema },
    ]),
    UserModule,
    EmailModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: PAYMENT_ADAPTER,
      useFactory: (c: ConfigService) => createPaymentAdapter(c),
      inject: [ConfigService],
    },
    {
      provide: POD_ADAPTER,
      useFactory: (c: ConfigService) => createPodAdapter(c),
      inject: [ConfigService],
    },
    {
      provide: LOGISTICS_ADAPTER,
      useFactory: (c: ConfigService) => createLogisticsAdapter(c),
      inject: [ConfigService],
    },
    {
      provide: PAYOUT_ADAPTER,
      useFactory: (c: ConfigService) => createPayoutAdapter(c),
      inject: [ConfigService],
    },
  ],
})
export class OrdersModule {}
