import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentsController } from './payments.controller';
import { Product } from '../products/entities/product.entity';
import { ShippingModule } from '../shipping/shipping.module';
import { Order } from './entities/order.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity'; // Import the User entity
import { NotificationsModule } from '../notifications/notifications.module';
import { CmsModule } from '../cms/cms.module';
import { AirtableService } from './airtable.service';
import { XeroService } from './xero.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Company, User, Product]),
    NotificationsModule,
    ShippingModule,
    CmsModule,
  ],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService, AirtableService, XeroService],
  exports: [AirtableService, OrdersService, XeroService], // Export so QuotesModule can use it
})
export class OrdersModule { }
