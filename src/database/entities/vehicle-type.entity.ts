import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { MakeEntity } from './make.entity';

@Entity({ name: 'vehicle_types' })
export class VehicleTypeEntity {
  @PrimaryColumn({ name: 'make_id', type: 'integer' })
  makeId!: number;

  @PrimaryColumn({ name: 'type_id', type: 'integer' })
  typeId!: number;

  @Column({ name: 'type_name', type: 'text' })
  typeName!: string;

  @ManyToOne(() => MakeEntity, (make) => make.vehicleTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'make_id', referencedColumnName: 'makeId' })
  make!: MakeEntity;
}
