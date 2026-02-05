import { Controller, Post, Body, Get, UseGuards, Req, Param, HttpCode, HttpStatus, Patch, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  private async verifyRecaptcha(req: any, token?: string): Promise<boolean> {
    const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    if (!isProduction) return true;
    const enforce = String(process.env.RECAPTCHA_ENFORCE || 'false').toLowerCase() === 'true';
    if (!enforce) return true;
    const secret = process.env.RECAPTCHA_SECRET || '';
    if (!secret) return true;
    const t = String(token || '').trim();
    if (!t) return false;
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', t);
    const ip = (req?.ip || req?.headers?.['x-forwarded-for'] || '') as any;
    const ipStr = Array.isArray(ip) ? ip[0] : String(ip || '');
    if (ipStr) params.append('remoteip', ipStr);
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.3');
    const expectAction = String(process.env.RECAPTCHA_EXPECT_ACTION || 'checkout');
    try {
      const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
      const data = await resp.json();
      if (data && data.success) return true;
      const scoreOk = typeof data?.score === 'number' ? data.score >= minScore : true;
      const actionOk = data?.action ? String(data.action) === expectAction : true;
      if (!!data?.success && scoreOk && actionOk) return true;
    } catch (_e) { void _e; }
    try {
      const resp2 = await fetch('https://www.recaptcha.net/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
      const data2 = await resp2.json();
      if (data2 && data2.success) return true;
      const scoreOk2 = typeof data2?.score === 'number' ? data2.score >= minScore : true;
      const actionOk2 = data2?.action ? String(data2.action) === expectAction : true;
      if (!!data2?.success && scoreOk2 && actionOk2) return true;
    } catch (_e) { void _e; }
    return false;
  }

  @Post('guest')
  @ApiOperation({ summary: 'Create a new order (guest checkout)' })
  async createGuest(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const ok = await this.verifyRecaptcha(req, (createOrderDto as any).recaptchaToken);
    if (!ok) throw new BadRequestException('recaptcha_failed');
    return this.ordersService.create(createOrderDto);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON, UserRole.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new order (from admin or sales portal)' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const ok = await this.verifyRecaptcha(req, (createOrderDto as any).recaptchaToken);
    if (!ok) throw new BadRequestException('recaptcha_failed');
    const creatorId = req.user.userId;
    return this.ordersService.create(createOrderDto, creatorId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('my-orders')
  @Roles(UserRole.SALESPERSON)
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @ApiOperation({ summary: 'Get orders created by the current salesperson' })
  findMyOrders(@Req() req) {
    const salespersonId = req.user.userId;
    return this.ordersService.findBySalesperson(salespersonId);
  }

  @Get('my')
  @Roles(UserRole.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get orders placed by the current buyer (by email)' })
  findMyBuyerOrders(@Req() req) {
    const email = req.user.email;
    return this.ordersService.findByBuyerEmail(email);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON, UserRole.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @ApiOperation({ summary: 'Get a single order by ID (access controlled)' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.ordersService.findAccessible(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update order fields (status, trackingNumber, carrier)' })
  async update(@Param('id') id: string, @Body() body: any, @Req() req) {
    const allowed: any = {};
    if (body.status) allowed.status = body.status;
    if (typeof body.trackingNumber === 'string') allowed.trackingNumber = body.trackingNumber.trim();
    if (typeof body.carrier === 'string') allowed.carrier = body.carrier.trim();
    return this.ordersService.updateOrder(id, allowed, req.user);
  }

  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public tracking lookup for orders by reference and email' })
  async trackOrder(@Body() body: { referenceNumber: string; email: string }) {
    const ref = (body.referenceNumber || '').trim();
    const email = (body.email || '').toLowerCase();
    if (!ref || !email) {
      return { found: false };
    }
    const all = await this.ordersService.findAll();
    const refNorm = ref.replace(/\s+/g, '').toUpperCase();
    const match = all.find(o => {
      const shipEmail = (o.shippingAddress?.email || '').toLowerCase();
      const human2 = o.friendlyId.toUpperCase();
      const dt = o.createdAt ? new Date(o.createdAt) : new Date();
      const yyyy = String(dt.getFullYear());
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const idPart = String(o.id || '').replace(/-/g, '').slice(0, 4).toUpperCase();
      const human4 = `ORD-${yyyy}${mm}${dd}-${idPart}`.toUpperCase();
      const idExact = String(o.id || '').toUpperCase();
      const idShort = idPart;
      const byRef = refNorm === idExact || refNorm === human2 || refNorm === human4 || refNorm === idShort;
      return byRef && shipEmail === email;
    });
    if (!match) return { found: false };
    return {
      found: true,
      data: {
        id: match.id,
        referenceNumber: match.friendlyId,
        status: match.status,
        trackingNumber: match.trackingNumber || null,
        carrier: match.carrier || null,
        total: match.total,
        createdAt: match.createdAt,
        shippingAddress: match.shippingAddress || null,
      }
    };
  }

  @Post(':id/sync-airtable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Manually sync an order to Airtable' })
  async syncToAirtable(@Param('id') id: string) {
    await this.ordersService.syncToAirtable(id);
    return { success: true, message: 'Order synced to Airtable successfully' };
  }

  @Post(':id/sync-xero')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Manually sync an order to Xero' })
  async syncToXero(@Param('id') id: string) {
    await this.ordersService.syncToXero(id);
    return { success: true, message: 'Order synced to Xero successfully' };
  }
}
