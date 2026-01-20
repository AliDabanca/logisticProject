import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class AppService implements OnModuleInit {
  private kafka = new Kafka({
    brokers: ['127.0.0.1:9092'], // localhost yerine 127.0.0.1 dene
    clientId: 'simulator-producer-' + Math.random().toString(36).substring(7), // Her seferinde benzersiz ID
    retry: {
      initialRetryTime: 100,
      retries: 10
    }
  });
  private producer = this.kafka.producer();

  // Sabit Rotalar
  private landRoute = [
    { lat: 40.9918, lng: 28.8311 }, // Bakırköy
    { lat: 41.0125, lng: 28.9182 }, // Topkapı
    { lat: 41.0422, lng: 28.9911 }, // Mecidiyeköy
    { lat: 41.0521, lng: 29.0123 }, // Boğaz Köprüsü Girişi
  ];

  private seaRoute = [
    { lat: 41.0050, lng: 28.9850 }, // Sarayburnu
    { lat: 41.0350, lng: 29.0250 }, // Çengelköy
    { lat: 41.0650, lng: 29.0450 }, // Bebek
    { lat: 41.1050, lng: 29.0650 }, // İstinye
  ];

  // Araçların anlık durumlarını sakladığımız yer
  private vehicles = [
    { id: 'TIR-01', route: this.landRoute, lat: 40.9918, lng: 28.8311, targetIdx: 1, speed: 50 },
    { id: 'KAMYON-02', route: this.landRoute, lat: 41.0125, lng: 28.9182, targetIdx: 2, speed: 70 },
    { id: 'MOTOR-03', route: this.landRoute, lat: 41.0422, lng: 28.9911, targetIdx: 3, speed: 40 },
    { id: 'GEMI-04', route: this.seaRoute, lat: 41.0050, lng: 28.9850, targetIdx: 1, speed: 20 },
  ];

  async onModuleInit() {
    await this.producer.connect();
    this.startSimulating();
  }

  async startSimulating() {
    setInterval(async () => {
      for (let v of this.vehicles) {
        const target = v.route[v.targetIdx];

        // 1. ADIM: Çok daha küçük bir adım miktarı (0.0001 yaklaşık 10 metre)
        const step = 0.0004;

        // Enlem (Lat) ilerlemesi
        if (Math.abs(v.lat - target.lat) > step) {
          v.lat += v.lat < target.lat ? step : -step;
        }
        // Boylam (Lng) ilerlemesi
        if (Math.abs(v.lng - target.lng) > step) {
          v.lng += v.lng < target.lng ? step : -step;
        }

        // 2. ADIM: Hedefe ulaştığını kontrol et (Mesafe kontrolü)
        const dist = Math.sqrt(Math.pow(target.lat - v.lat, 2) + Math.pow(target.lng - v.lng, 2));

        if (dist < 0.001) {
          v.targetIdx = (v.targetIdx + 1) % v.route.length;
          console.log(`${v.id} yeni hedefe yöneldi: ${v.targetIdx}`);
        }

        const vehicleData = {
          vehicleId: v.id,
          lat: v.lat,
          lng: v.lng,
          speed: Math.floor(Math.random() * 10 + v.speed),
          timestamp: new Date().toISOString(),
        };

        await this.producer.send({
          topic: 'vehicle.locations',
          messages: [{ value: JSON.stringify(vehicleData) }],
        });
      }
    }, 2000); // 2 saniyede bir gönderim akıcılık için idealdir
  }
}