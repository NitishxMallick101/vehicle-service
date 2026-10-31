import { Injectable, Logger } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { VehicleMake, VehicleType } from './vehicle-data.types';

type XmlRecord = Record<string, unknown>;

@Injectable()
export class VehicleXmlParser {
  private readonly logger = new Logger(VehicleXmlParser.name);
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    trimValues: true,
    parseTagValue: false,
  });

  parseMakes(xml: string): VehicleMake[] {
    const root = this.parseDocument(xml, 'makes');
    if (root.Results === '') {
      return [];
    }
    const results = this.record(root.Results, 'Results');
    return this.asArray(results.AllVehicleMakes).map((value) => {
      const make = this.record(value, 'AllVehicleMakes');
      return {
        makeId: this.positiveInteger(make.Make_ID, 'Make_ID'),
        makeName: this.nonEmptyString(make.Make_Name, 'Make_Name'),
      };
    });
  }

  parseVehicleTypes(xml: string, makeId: number): VehicleType[] {
    const root = this.parseDocument(xml, `vehicle types for make ${makeId}`);
    if (root.Results === '') {
      return [];
    }
    const results = this.record(root.Results, 'Results');
    return this.asArray(results.VehicleTypesForMakeIds).map((value) => {
      const vehicleType = this.record(value, 'VehicleTypesForMakeIds');
      return {
        typeId: this.positiveInteger(vehicleType.VehicleTypeId, 'VehicleTypeId'),
        typeName: this.nonEmptyString(
          vehicleType.VehicleTypeName,
          'VehicleTypeName',
        ),
      };
    });
  }

  private parseDocument(xml: string, operation: string): XmlRecord {
    if (!xml.trim()) {
      throw new Error(`Empty XML response while parsing ${operation}`);
    }

    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      this.logger.error(
        JSON.stringify({ event: 'xml_parse_failed', operation }),
      );
      throw new Error(`Malformed XML response while parsing ${operation}`);
    }

    const document: unknown = this.parser.parse(xml);
    const root = this.record(document, 'document');
    if (!root.Response) {
      throw new Error(`Unexpected XML response while parsing ${operation}`);
    }
    return this.record(root.Response, 'Response');
  }

  private record(value: unknown, field: string): XmlRecord {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`Invalid XML field: ${field}`);
    }
    return value as XmlRecord;
  }

  private asArray(value: unknown): unknown[] {
    if (value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private positiveInteger(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error(`Invalid XML field: ${field}`);
    }
    return parsed;
  }

  private nonEmptyString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid XML field: ${field}`);
    }
    return value.trim();
  }
}
