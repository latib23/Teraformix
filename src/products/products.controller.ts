import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IpWhitelistGuard } from '../auth/guards/ip-whitelist.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert products by SKU' })
  bulk(@Body() items: any[]) {
    return this.productsService.bulkUpsert(Array.isArray(items) ? items : []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/reviews')
  async addReview(@Param('id') id: string, @Body() body: any) {
    const product: any = await this.productsService.findOne(id);
    const review = {
      author: body.author || 'Anonymous',
      datePublished: new Date().toISOString().split('T')[0],
      reviewBody: body.reviewBody,
      ratingValue: body.ratingValue,
      status: 'PENDING'
    };

    const schema = product.schema || {};
    // Ensure reviews array exists in schema or custom field
    // We will use schema.reviews as the storage
    let reviews = [];
    try {
      if (typeof schema.reviews === 'string') reviews = JSON.parse(schema.reviews);
      else if (Array.isArray(schema.reviews)) reviews = schema.reviews;
    } catch { }

    reviews.push(review);
    schema.reviews = reviews;

    // Also update top-level stats if we want, but usually we wait for approval.
    // We will ONLY update the storage here.

    await this.productsService.update(product.id, { schema });
    return { success: true, message: 'Review submitted for approval' };
  }

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return products.map(this.mapToFrontend);
  }

  @Get('paginated')
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async paginated(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    const { items, total } = await this.productsService.findPaginated({
      limit: Number(limit ?? 30),
      offset: Number(offset ?? 0),
      q,
      brand,
      category,
      sort,
    });
    return { items: items.map(this.mapToFrontend), total };
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    const products = await this.productsService.search(query);
    return products.map(this.mapToFrontend);
  }

  @Get('by-ids')
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated product UUIDs' })
  async byIds(@Query('ids') idsParam: string) {
    const ids = String(idsParam || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const products = await this.productsService.findByIds(ids);
    return products.map(this.mapToFrontend);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const p = await this.productsService.findOne(id);
    return this.mapToFrontend(p);
  }

  private mapToFrontend(p: any) {
    const a = p.attributes || {};
    const derived = {
      mpn: a.__schema_mpn,
      itemCondition: a.__schema_itemCondition,
      gtin13: a.__schema_gtin13,
      gtin14: a.__schema_gtin14,
      priceValidUntil: a.__schema_priceValidUntil,
      seller: a.__schema_seller,
      ratingValue: a.__schema_ratingValue,
      reviewCount: a.__schema_reviewCount,
      reviews: a.__schema_reviews,
    };
    const hasSchema = p.schema && Object.keys(p.schema || {}).length > 0;
    const schema = hasSchema ? p.schema : derived;
    return {
      ...p,
      price: Number(p.basePrice),
      specs: a,
      schema,
      stockStatus: p.stockLevel > 0 ? 'IN_STOCK' : 'BACKORDER',
      brand: p.brand || 'Generic',
      category: p.category || 'Uncategorized',
      image: p.image || ''
    };
  }
}
