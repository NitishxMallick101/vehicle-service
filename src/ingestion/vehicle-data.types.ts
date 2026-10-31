export interface VehicleMake {
  makeId: number;
  makeName: string;
}

export interface VehicleType {
  typeId: number;
  typeName: string;
}

export interface UnifiedVehicleMake extends VehicleMake {
  vehicleTypes: VehicleType[];
}
