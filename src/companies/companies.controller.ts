import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, IpWhitelistGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies (Admin)' })
  findAll() {
    return this.companiesService.findAll();
  }
}