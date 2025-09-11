import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { CreateGeolocationDto } from './dto/create-geolocation.dto';

@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  /**
   * Endpoint para que un vendedor actualice su ubicación.
   * Se accede a través de: PATCH http://localhost:3000/geolocation/ID_DEL_VENDEDOR
   */
  @Patch(':vendorId')
  update(
    @Param('vendorId') vendorId: string,
    @Body() createGeolocationDto: CreateGeolocationDto,
  ) {
    return this.geolocationService.updateLocation(vendorId, createGeolocationDto);
  }

  /**
   * Endpoint para obtener la última ubicación de un vendedor.
   * Se accede a través de: GET http://localhost:3000/geolocation/ID_DEL_VENDEDOR
   */
  @Get(':vendorId')
  findOne(@Param('vendorId') vendorId: string) {
    return this.geolocationService.findOneByVendor(vendorId);
  }
}