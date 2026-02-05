import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';

class GetRatesDto {
  @ApiProperty()
  address: {
    postalCode: string;
    country: string;
    city: string;
    state: string;
  };
  @ApiProperty()
  items: any[];
}

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rates')
  @ApiOperation({ summary: 'Get live shipping rates' })
  async getRates(@Body() body: GetRatesDto) {
    if (!body.address || !body.address.postalCode) {
      throw new BadRequestException('Destination postal code is required');
    }
    return this.shippingService.getRates(body.address, body.items);
  }
}
