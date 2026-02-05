import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from './entities/quote.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CmsModule } from '../cms/cms.module';

import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote]),
    NotificationsModule,
    CmsModule,
    forwardRef(() => OrdersModule), // Use forwardRef if circular dependency exists, or just direct import if not
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule { }