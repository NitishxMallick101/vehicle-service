import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleTables1730000000000 implements MigrationInterface {
  name = 'CreateVehicleTables1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "makes" (
        "make_id" integer NOT NULL,
        "make_name" text NOT NULL,
        CONSTRAINT "PK_makes_make_id" PRIMARY KEY ("make_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_makes_make_name" ON "makes" ("make_name")
    `);
    await queryRunner.query(`
      CREATE TABLE "vehicle_types" (
        "make_id" integer NOT NULL,
        "type_id" integer NOT NULL,
        "type_name" text NOT NULL,
        CONSTRAINT "PK_vehicle_types" PRIMARY KEY ("make_id", "type_id"),
        CONSTRAINT "FK_vehicle_types_make"
          FOREIGN KEY ("make_id") REFERENCES "makes"("make_id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "vehicle_types"');
    await queryRunner.query('DROP INDEX "IDX_makes_make_name"');
    await queryRunner.query('DROP TABLE "makes"');
  }
}
