import { MigrationInterface, QueryRunner } from 'typeorm';

export class createLoanRequestTable1656692860152 implements MigrationInterface {
  name = 'createLoanRequestTable1656692860152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."loan_request_status_enum" AS ENUM('CREADA', 'REVISION', 'RECHAZADA', 'APROBADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loan_request" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying(160) NOT NULL, "amount" numeric(12,3) NOT NULL, "status" "public"."loan_request_status_enum" NOT NULL DEFAULT 'CREADA', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uk_loan_request_uid" UNIQUE ("uid"), CONSTRAINT "PK_11781d1e7f2d3bdfa8602557a98" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "loan_request"`);
    await queryRunner.query(`DROP TYPE "public"."loan_request_status_enum"`);
  }
}
