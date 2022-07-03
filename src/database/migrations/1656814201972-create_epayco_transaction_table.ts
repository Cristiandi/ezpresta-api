import { MigrationInterface, QueryRunner } from 'typeorm';

export class createEpaycoTransactionTable1656814201972
  implements MigrationInterface
{
  name = 'createEpaycoTransactionTable1656814201972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "epayco_transaction" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "reference" character varying(160), "amount" numeric(12,3) NOT NULL, "status" integer NOT NULL DEFAULT '0', "used" boolean DEFAULT false, "comment" character varying(160), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "loan_id" integer NOT NULL, CONSTRAINT "uk_epayco_transaction_uid" UNIQUE ("uid"), CONSTRAINT "PK_1900ecda7d28382f3c582fa6b25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "epayco_transaction" ADD CONSTRAINT "FK_52bb1f7be71aa5746868df72c97" FOREIGN KEY ("loan_id") REFERENCES "loan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "epayco_transaction" DROP CONSTRAINT "FK_52bb1f7be71aa5746868df72c97"`,
    );
    await queryRunner.query(`DROP TABLE "epayco_transaction"`);
  }
}
