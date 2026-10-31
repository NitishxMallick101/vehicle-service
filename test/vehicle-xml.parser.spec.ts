import { VehicleXmlParser } from '../src/ingestion/vehicle-xml.parser';

describe('VehicleXmlParser', () => {
  const parser = new VehicleXmlParser();

  it('parses repeated makes and XML entities', () => {
    const makes = parser.parseMakes(`
      <Response>
        <Results>
          <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>Ford &amp; Sons</Make_Name></AllVehicleMakes>
          <AllVehicleMakes><Make_ID>441</Make_ID><Make_Name>Example Motors</Make_Name></AllVehicleMakes>
        </Results>
      </Response>
    `);

    expect(makes).toEqual([
      { makeId: 440, makeName: 'Ford & Sons' },
      { makeId: 441, makeName: 'Example Motors' },
    ]);
  });

  it('parses vehicle types and accepts an empty result set', () => {
    expect(
      parser.parseVehicleTypes(
        '<Response><Results><VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds></Results></Response>',
        440,
      ),
    ).toEqual([{ typeId: 2, typeName: 'Passenger Car' }]);
    expect(parser.parseMakes('<Response><Results/></Response>')).toEqual([]);
    expect(
      parser.parseVehicleTypes('<Response><Results/></Response>', 440),
    ).toEqual([]);
  });

  it.each(['', '<Response><Results>', '<Envelope/>'])(
    'rejects empty, malformed, or unexpected XML: %s',
    (xml) => {
      expect(() => parser.parseMakes(xml)).toThrow();
    },
  );
});
