import { Injectable } from '@nestjs/common';
import {
  UnifiedVehicleMake,
  VehicleMake,
  VehicleType,
} from './vehicle-data.types';

@Injectable()
export class VehicleDataTransformer {
  unify(
    makes: VehicleMake[],
    vehicleTypesByMake: ReadonlyMap<number, VehicleType[]>,
  ): UnifiedVehicleMake[] {
    const seenMakeIds = new Set<number>();
    return makes.map((make) => {
      if (seenMakeIds.has(make.makeId)) {
        throw new Error(`Duplicate make ID: ${make.makeId}`);
      }
      seenMakeIds.add(make.makeId);

      const vehicleTypes = vehicleTypesByMake.get(make.makeId);
      if (!vehicleTypes) {
        throw new Error(`Missing vehicle types for make ${make.makeId}`);
      }
      const seenTypeIds = new Set<number>();
      for (const vehicleType of vehicleTypes) {
        if (seenTypeIds.has(vehicleType.typeId)) {
          throw new Error(
            `Duplicate vehicle type ${vehicleType.typeId} for make ${make.makeId}`,
          );
        }
        seenTypeIds.add(vehicleType.typeId);
      }

      return {
        makeId: make.makeId,
        makeName: make.makeName,
        vehicleTypes: vehicleTypes.map(({ typeId, typeName }) => ({
          typeId,
          typeName,
        })),
      };
    });
  }
}
