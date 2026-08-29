import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { JwtAuthModule } from '../auth/jwt-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    JwtAuthModule, // needed by JwtAuthGuard/RolesGuard on the staff-only routes
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // PaymentsModule needs this to look orders up
})
export class OrdersModule {}