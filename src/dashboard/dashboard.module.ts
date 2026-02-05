import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Product]), CmsModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}