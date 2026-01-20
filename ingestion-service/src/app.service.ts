import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { EventsGateway } from './events.gateway';
import { InjectRepository } from '@nestjs/typeorm'; // [EKLE] Veritabanı bağlantısı için
import { Repository } from 'typeorm'; // [EKLE]
import { VehicleLocation } from './vehicle-location.entity'; // [EKLE] Yeni oluşturduğumuz dosya

@Injectable()
export class AppService implements OnModuleInit {
  private redis = new Redis({ host: 'localhost', port: 6379 });
  private kafka = new Kafka({ brokers: ['127.0.0.1:9092'] });
  private consumer = this.kafka.consumer({ groupId: 'ingestion-group-v4' });

  constructor(
    private eventsGateway: EventsGateway,
    // [EKLE] Veritabanı tablomuzu buraya enjekte ediyoruz
    @InjectRepository(VehicleLocation)
    private readonly locationRepository: Repository<VehicleLocation>,
  ) { }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'vehicle.locations', fromBeginning: false });

    console.log('Ingestion Service: Kafka, Redis ve PostgreSQL (Arşiv) hazır. 🚀');

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const vehicleData = JSON.parse(message.value.toString());

        // --- 1. ADIM: VERİTABANINA KAYDET (ARŞİV) ---
        // Bu işlem veriyi Windows'taki PostgreSQL'e sonsuza kadar kaydeder
        try {
          const newEntry = this.locationRepository.create({
            vehicleId: vehicleData.vehicleId,
            lat: vehicleData.lat,
            lng: vehicleData.lng,
            speed: vehicleData.speed,
            timestamp: new Date(vehicleData.timestamp),
          });
          await this.locationRepository.save(newEntry);
        } catch (error) {
          console.error('Veritabanına kaydedilirken hata oluştu ❌:', error.message);
        }

        // --- 2. ADIM: REDIS GÜNCELLE (ANLIK DURUM) ---
        await this.redis.set(
          `vehicle:${vehicleData.vehicleId}`,
          JSON.stringify(vehicleData),
        );

        // --- 3. ADIM: SOCKET İLE FRONTEND'E GÖNDER ---
        this.eventsGateway.sendVehicleUpdate(vehicleData);

        console.log(`Veri İşlendi ✅: ${vehicleData.vehicleId} | Hız: ${vehicleData.speed}`);
      },
    });
  }
}