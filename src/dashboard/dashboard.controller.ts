import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard, IpWhitelistGuard)
  @ApiOperation({ summary: 'Get aggregated stats for admin dashboard' })
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }
  
  @Get('sales')
  @Roles(UserRole.SALESPERSON)
  @UseGuards(RolesGuard, IpWhitelistGuard)
  @ApiOperation({ summary: 'Get stats for the salesperson dashboard' })
  getSalesStats(@Req() req) {
    const userId = req.user.userId;
    return this.dashboardService.getSalesStats(userId);
  }
}