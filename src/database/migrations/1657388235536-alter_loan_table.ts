import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterLoanTable1657388235536 implements MigrationInterface {
  name = 'alterLoanTable1657388235536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" ADD "paid" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "loan" DROP COLUMN "paid"`);
  }
}
