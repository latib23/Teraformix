import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), CmsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [TypeOrmModule], // Export for use in Orders module
})
export class CompaniesModule {}