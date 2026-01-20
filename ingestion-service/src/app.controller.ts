import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleLocation } from './vehicle-location.entity';

@Controller('vehicles')
export class AppController {
  constructor(
    @InjectRepository(VehicleLocation)
    private readonly locationRepository: Repository<VehicleLocation>,
  ) { }

  // Aracın son 50 hareketini getirir
  @Get('history/:vehicleId')
  async getHistory(@Param('vehicleId') vehicleId: string) {
    return await this.locationRepository.find({
      where: { vehicleId },
      order: { timestamp: 'DESC' }, // En yeni veriden eskiye doğru
      take: 50,
    });
  }
}