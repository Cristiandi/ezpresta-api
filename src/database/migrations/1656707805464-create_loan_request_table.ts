import { MigrationInterface, QueryRunner } from 'typeorm';

export class createLoanRequestTable1656707805464 implements MigrationInterface {
  name = 'createLoanRequestTable1656707805464';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."loan_request_status_enum" AS ENUM('CREADA', 'REVISION', 'RECHAZADA', 'APROBADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loan_request" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying(160) NOT NULL, "amount" numeric(12,3) NOT NULL, "status" "public"."loan_request_status_enum" NOT NULL DEFAULT 'CREADA', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "uk_loan_request_uid" UNIQUE ("uid"), CONSTRAINT "PK_11781d1e7f2d3bdfa8602557a98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_request" ADD CONSTRAINT "FK_ccf240ab294b735125a1b7c4b1f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_request" DROP CONSTRAINT "FK_ccf240ab294b735125a1b7c4b1f"`,
    );
    await queryRunner.query(`DROP TABLE "loan_request"`);
    await queryRunner.query(`DROP TYPE "public"."loan_request_status_enum"`);
  }
}
