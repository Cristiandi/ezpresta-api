import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterUserTable1656035849032 implements MigrationInterface {
  name = 'alterUserTable1656035849032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "addres" TO "address"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "address" TO "addres"`,
    );
  }
}
