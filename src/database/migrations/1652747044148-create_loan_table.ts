import { MigrationInterface, QueryRunner } from 'typeorm';

export class createLoanTable1652747044148 implements MigrationInterface {
  name = 'createLoanTable1652747044148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "loan" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(12,3) NOT NULL, "annual_interest_rate" numeric(5,3) NOT NULL, "monthly_interest_rate" numeric(5,3) NOT NULL, "annual_interest_overdue_rate" numeric(5,3) NOT NULL, "monthly_interest_overdue_rate" numeric(5,3) NOT NULL, "start_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "uk_loan_uid" UNIQUE ("uid"), CONSTRAINT "PK_4ceda725a323d254a5fd48bf95f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "FK_53e13d0f4512c420ceb586f6737" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" DROP CONSTRAINT "FK_53e13d0f4512c420ceb586f6737"`,
    );
    await queryRunner.query(`DROP TABLE "loan"`);
  }
}
