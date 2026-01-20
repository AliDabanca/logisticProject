import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class VehicleLocation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    vehicleId: string;

    @Column('float')
    lat: number;

    @Column('float')
    lng: number;

    @Column()
    speed: number;

    @CreateDateColumn()
    timestamp: Date;
}