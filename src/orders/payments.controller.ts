import { Controller, Post, Body, BadRequestException, HttpException, Get, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { ConfigService } from '@nestjs/config';

class CreateIntentDto {
  @ApiProperty({ required: false, description: 'Amount in cents (server will prefer computed amount when items are provided)' })
  amount?: number;
  @ApiProperty({ required: false, default: 'usd' })
  currency?: string;
  @ApiProperty({ required: false, type: 'array', description: 'Cart items for server-side total calculation' })
  items?: Array<{ sku: string; quantity: number }>;
  @ApiProperty({ required: false, description: 'Shipping address for rate calculation' })
  address?: { postalCode: string; country: string; city: string; state: string };
  @ApiProperty({ required: false, description: 'Selected shipping service code to include shipment cost' })
  serviceCode?: string;
  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
  @ApiProperty({ required: false })
  recaptchaToken?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly ordersService: OrdersService, private readonly configService: ConfigService) {}

  private async verifyRecaptcha(req: any, token?: string): Promise<boolean> {
    const env = (process.env.NODE_ENV || '').toLowerCase();
    if (env !== 'production') return true;
    const enforce = String(process.env.RECAPTCHA_ENFORCE || 'false').toLowerCase() === 'true';
    if (!enforce) return true;
    const secret = this.configService.get<string>('RECAPTCHA_SECRET') || process.env.RECAPTCHA_SECRET || '';
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

  @Post('intent')
  @ApiOperation({ summary: 'Create Stripe PaymentIntent (manual capture)' })
  async createIntent(@Body() body: CreateIntentDto, @Req() req: any) {
    try {
      const ok = await this.verifyRecaptcha(req, body.recaptchaToken);
      if (!ok) throw new BadRequestException('recaptcha_failed');
      const currency = String(body.currency || 'usd').toLowerCase();
      if (currency !== 'usd') throw new BadRequestException('Unsupported currency');

      let amount = 0;
      const providedAmount = Number(body.amount);
      const hasProvidedAmount = !!providedAmount && providedAmount > 0;
      const hasCart = Array.isArray(body.items) && body.items.length > 0 && body.address;

      if (hasProvidedAmount && !hasCart) {
        const MAX = 10000000;
        if (providedAmount > MAX) throw new BadRequestException('Amount exceeds limit');
        amount = providedAmount;
      } else if (hasCart) {
        amount = await this.ordersService.calculateAmountCents(body.items, body.address, body.serviceCode);
        if (hasProvidedAmount) {
          const MAX = 10000000;
          if (providedAmount > 0 && providedAmount <= MAX) {
            amount = providedAmount;
          }
        }
      } else {
        throw new BadRequestException('Invalid amount');
      }

      const intent = await this.ordersService.createPaymentIntent(amount, currency, {
        ...(body.metadata || {}),
        serviceCode: body.serviceCode || '',
      });
      return { clientSecret: intent.client_secret, id: intent.id, status: intent.status };
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new BadRequestException(String(e?.message || 'Payment error'));
    }
  }

  @ApiOperation({ summary: 'Stripe connectivity status' })
  @Post('status')
  async status() {
    try {
      const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
      if (isProduction) {
        throw new ForbiddenException('unavailable_in_production');
      }
      const testAmount = 100;
      const intent = await this.ordersService.createPaymentIntent(testAmount, 'usd');
      return { ok: true, id: intent.id, status: intent.status };
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new BadRequestException(String(e?.message || 'Stripe connectivity error'));
    }
  }

  @Get('public-key')
  @ApiOperation({ summary: 'Get Stripe publishable key for frontend' })
  publicKey() {
    const key = this.configService.get<string>('STRIPE_PUBLIC_KEY') || '';
    return { key };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check if card payments are enabled on server' })
  availability() {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    const pub = this.configService.get<string>('STRIPE_PUBLIC_KEY') || '';
    const enabled = !!secret;
    return { enabled, hasPublicKey: !!pub };
  }

  @Get('recaptcha-key')
  @ApiOperation({ summary: 'Get reCAPTCHA site key for frontend' })
  recaptchaKey() {
    const key = this.configService.get<string>('RECAPTCHA_SITE_KEY') || process.env.RECAPTCHA_SITE_KEY || '';
    return { key };
  }
}
