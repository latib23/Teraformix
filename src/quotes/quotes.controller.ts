
import { Controller, Post, Body, Param, Patch, Get, Req, Res, HttpCode, HttpStatus, UseGuards, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { QuoteStatus } from './entities/quote.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConciergeRequestDto } from './dto/concierge-request.dto';
import { BulkQuoteRequestDto } from './dto/bulk-quote-request.dto';
import { BomUploadRequestDto } from './dto/bom-upload-request.dto';
import { QuoteBeatingRequestDto } from './dto/quote-beating-request.dto';
import { ContactRequestDto } from './dto/contact-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';


@ApiTags('quotes')
@Controller('quotes')
@UseGuards(IpWhitelistGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) { }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quote requests (Admin Inbox)' })
  findAll() {
    return this.quotesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Request a new cart quote' })
  requestQuote(@Body() body: any) {
    // Placeholder for authenticated user cart-to-quote conversion
    return { message: "Quote requested" };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quotes associated with the current buyer' })
  findMyQuotes(@Req() req) {
    return this.quotesService.findForUser(req.user.userId, req.user.email);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin approves quote with custom price' })
  approveQuote(@Param('id') id: string, @Body('total') total: number) {
    return this.quotesService.approveQuote(id, total);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quote details' })
  updateQuote(@Param('id') id: string, @Body() body: any) {
    return this.quotesService.update(id, body);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a manual quote by sales team' })
  async createManualQuote(@Body() body: any) {
    return this.quotesService.createManual(body);
  }

  @Post('request/concierge')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a concierge sourcing request' })
  async conciergeRequest(@Body() body: ConciergeRequestDto) {
    const quote = await this.quotesService.handleConciergeRequest(body);
    return {
      message: "Concierge request received.",
      referenceNumber: quote.referenceNumber
    };
  }

  @Post('request/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a bulk quote request from the modal' })
  async bulkQuoteRequest(@Body() body: BulkQuoteRequestDto) {
    const quote = await this.quotesService.handleBulkQuoteRequest(body);
    return {
      message: "Bulk quote request received.",
      referenceNumber: quote.referenceNumber
    };
  }

  @Post('request/bom')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a BOM upload' })
  async bomUploadRequest(@Body() body: BomUploadRequestDto) {
    const quote = await this.quotesService.handleBomUpload(body);
    return {
      message: "BOM submission received.",
      referenceNumber: quote.referenceNumber
    };
  }

  @Post('request/beat-quote')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a quote beating request' })
  async quoteBeatingRequest(@Body() body: QuoteBeatingRequestDto) {
    const quote = await this.quotesService.handleQuoteBeatingRequest(body);
    return {
      message: "Quote beating request received.",
      referenceNumber: quote.referenceNumber
    };
  }

  @Post('request/contact')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a contact us request' })
  async contactRequest(@Body() body: ContactRequestDto) {
    const quote = await this.quotesService.handleContactRequest(body);
    return {
      message: "Contact request received.",
      referenceNumber: quote.referenceNumber
    };
  }

  @Get(':id/file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download BOM file content (Admin only)' })
  async downloadBomFile(@Param('id') id: string, @Req() _req, @Body() _body: any, @Res() res: Response) {
    const quote = await this.quotesService.findOne(id);
    if (!quote || quote.type !== 'BOM_UPLOAD') {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'BOM not found' });
    }

    const submission = quote.submissionData || {};
    const fileName = submission.fileName || `bom-${quote.referenceNumber}`;
    const dataUrl: string = submission.fileContent;
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No file content available' });
    }

    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid file data' });
    }
    const mime = match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, 'base64');

    res.setHeader('Content-Type', mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(HttpStatus.OK).send(buffer);
  }

  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public tracking lookup for quotes by reference and email' })
  async trackQuote(@Body() body: { referenceNumber: string; email: string }) {
    const ref = (body.referenceNumber || '').trim();
    const email = (body.email || '').toLowerCase();
    if (!ref || !email) {
      return { found: false };
    }
    const all = await this.quotesService.findAll();
    const match = all.find(q => {
      const guestEmail = (q.guestEmail || '').toLowerCase();
      const userEmail = (q.user?.email || '').toLowerCase();
      const byEmail = (guestEmail && guestEmail === email) || (userEmail && userEmail === email);
      return q.referenceNumber === ref && byEmail;
    });
    if (!match) return { found: false };
    return {
      found: true,
      data: {
        id: match.id,
        referenceNumber: match.referenceNumber,
        type: match.type,
        status: match.status,
        createdAt: match.createdAt,
        submissionData: {
          parts: match.submissionData?.parts,
          timeline: match.submissionData?.timeline,
          fileName: match.submissionData?.fileName,
        },
      }
    };
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Public access to quote for payment' })
  async getPublicQuote(@Param('id') id: string) {
    const quote = await this.quotesService.findOne(id);
    if (!quote) throw new NotFoundException('Quote not found');

    // Return only necessary data for payment page
    return {
      id: quote.id,
      referenceNumber: quote.referenceNumber,
      status: quote.status,
      createdAt: quote.createdAt,
      total: quote.submissionData?.total || 0, // Assuming total is stored here or needs calculation
      paymentTerms: quote.paymentTerms,
      items: quote.submissionData?.cart || [],
      customer: {
        name: quote.guestName || quote.user?.name,
        email: quote.guestEmail || quote.user?.email,
        company: quote.guestCompany || quote.user?.company?.name,
      }
    };
  }

  @Post('public/:id/pay')
  @ApiOperation({ summary: 'Process payment for a quote' })
  async payQuote(@Param('id') id: string, @Body() paymentDetails: any) {
    // In a real app, integrate with Stripe/PayPal here
    // For now, we simulate a successful payment
    return this.quotesService.update(id, { status: QuoteStatus.PAID });
  }

  @Post('abandon')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capture abandoned checkout or form (no auth)' })
  async captureAbandoned(@Body() body: any) {
    const quote = await this.quotesService.captureAbandon(body);
    return { id: quote.id, referenceNumber: quote.referenceNumber };
  }
  @Post(':id/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger Airtable sync for a quote' })
  async syncQuote(@Param('id') id: string) {
    await this.quotesService.syncToAirtable(id);
    return { message: 'Sync triggered' };
  }
}
