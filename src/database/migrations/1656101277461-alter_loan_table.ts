import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterLoanTable1656101277461 implements MigrationInterface {
  name = 'alterLoanTable1656101277461';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" ADD "description" character varying(160)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "description"`);
  }
}
