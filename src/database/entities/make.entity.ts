import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { VehicleTypeEntity } from './vehicle-type.entity';

@Entity({ name: 'makes' })
export class MakeEntity {
  @PrimaryColumn({ name: 'make_id', type: 'integer' })
  makeId!: number;

  @Index('IDX_makes_make_name')
  @Column({ name: 'make_name', type: 'text' })
  makeName!: string;

  @OneToMany(() => VehicleTypeEntity, (vehicleType) => vehicleType.make, {
    cascade: false,
  })
  vehicleTypes!: VehicleTypeEntity[];
}
