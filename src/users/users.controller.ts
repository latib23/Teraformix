import { Controller, Get, Patch, Param, Body, UseGuards, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateUserTargetDto } from './dto/update-user.dto';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/permissions')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user permissions and role' })
  updatePermissions(@Param('id') id: string, @Body() body: { role: UserRole; permissions: string[] }) {
    return this.usersService.updatePermissions(id, body.role, body.permissions);
  }

  @Get('salespeople')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all salespeople with their total sales' })
  findSalespeople() {
    return this.usersService.findSalespeopleWithSales();
  }

  @Post('salespeople')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new salesperson' })
  createSalesperson(@Body() createSalespersonDto: CreateSalespersonDto) {
    return this.usersService.createSalesperson(createSalespersonDto);
  }

  @Get('buyers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all registered buyers' })
  findBuyers() {
    return this.usersService.findBuyers();
  }

  @Post('buyers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new buyer (customer)' })
  createBuyer(@Body() dto: CreateSalespersonDto) {
    return this.usersService.createBuyer(dto.name, dto.email, dto.password);
  }

  @Delete('buyers/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a buyer (customer) account' })
  deleteBuyer(@Param('id') id: string) {
    return this.usersService.deleteBuyer(id);
  }

  @Patch(':id/target')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a salesperson\'s monthly and quarterly targets' })
  updateTarget(@Param('id') id: string, @Body() dto: UpdateUserTargetDto) {
    return this.usersService.updateTarget(id, dto);
  }
}
