import { VehicleDataTransformer } from '../src/ingestion/vehicle-data.transformer';

describe('VehicleDataTransformer', () => {
  const transformer = new VehicleDataTransformer();

  it('combines makes and their types in the required shape', () => {
    expect(
      transformer.unify(
        [{ makeId: 440, makeName: 'Ford' }],
        new Map([[440, [{ typeId: 2, typeName: 'Passenger Car' }]]]),
      ),
    ).toEqual([
      {
        makeId: 440,
        makeName: 'Ford',
        vehicleTypes: [{ typeId: 2, typeName: 'Passenger Car' }],
      },
    ]);
  });

  it('rejects duplicate IDs and missing type results', () => {
    expect(() =>
      transformer.unify(
        [
          { makeId: 440, makeName: 'Ford' },
          { makeId: 440, makeName: 'Duplicate' },
        ],
        new Map([[440, []]]),
      ),
    ).toThrow('Duplicate make ID: 440');
    expect(() =>
      transformer.unify([{ makeId: 440, makeName: 'Ford' }], new Map()),
    ).toThrow('Missing vehicle types for make 440');
  });
});
