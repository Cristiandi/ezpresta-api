import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterMovementTable1655936007422 implements MigrationInterface {
  name = 'alterMovementTable1655936007422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "start_date"`);
    await queryRunner.query(
      `ALTER TABLE "loan" ADD "start_date" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "movement" DROP COLUMN "at"`);
    await queryRunner.query(
      `ALTER TABLE "movement" ADD "at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "movement" DROP COLUMN "at"`);
    await queryRunner.query(
      `ALTER TABLE "movement" ADD "at" date NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "start_date"`);
    await queryRunner.query(
      `ALTER TABLE "loan" ADD "start_date" date NOT NULL`,
    );
  }
}
