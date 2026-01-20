import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleLocation } from './vehicle-location.entity';
import { AppController } from './app.controller'; // [EKLE]
import { AppService } from './app.service';       // [EKLE]
import { EventsGateway } from './events.gateway'; // [EKLE - Socket hatasını bu çözer]

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'ali1486352',
      database: 'postgres',
      entities: [VehicleLocation],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([VehicleLocation]),
  ],
  controllers: [AppController], // [EKLE] - HTTP istekleri için
  providers: [AppService, EventsGateway], // [EKLE] - Arka plan işleri ve Socket için
})
export class AppModule { }