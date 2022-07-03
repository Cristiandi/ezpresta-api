import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterEpaycoTransactionTable1656886343851
  implements MigrationInterface
{
  name = 'alterEpaycoTransactionTable1656886343851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "epayco_transaction" ADD "testing" boolean DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "epayco_transaction" DROP COLUMN "testing"`,
    );
  }
}
