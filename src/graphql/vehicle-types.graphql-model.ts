import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('VehicleType')
export class VehicleTypeModel {
  @Field(() => ID)
  typeId!: number;

  @Field()
  typeName!: string;
}

@ObjectType('VehicleMake')
export class VehicleMakeModel {
  @Field(() => ID)
  makeId!: number;

  @Field()
  makeName!: string;

  @Field(() => [VehicleTypeModel])
  vehicleTypes!: VehicleTypeModel[];
}
