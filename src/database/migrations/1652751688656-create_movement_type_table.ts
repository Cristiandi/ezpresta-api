import { MigrationInterface, QueryRunner } from 'typeorm';

export class createMovementTypeTable1652751688656
  implements MigrationInterface
{
  name = 'createMovementTypeTable1652751688656';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movement_type" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(10) NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uk_movement_type_uid" UNIQUE ("uid"), CONSTRAINT "PK_4b89a614f1d3ceba0c19f399ba1" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "movement_type"`);
  }
}
