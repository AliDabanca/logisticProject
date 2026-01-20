import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // CORS hatasını kökten çözer
  },
  transports: ['websocket'], // Sadece websocket protokolüne zorla (polling hatalarını bitirir)
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  sendVehicleUpdate(data: any) {
    this.server.emit('vehicle_updated', data);
  }
}