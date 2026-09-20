import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Artwork, ArtworkSchema } from '../explore/schemas/artwork.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Artwork.name, schema: ArtworkSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    UserModule,
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
