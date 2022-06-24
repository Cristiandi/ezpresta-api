import { MigrationInterface, QueryRunner } from 'typeorm';

export class createMovementTable1652754804330 implements MigrationInterface {
  name = 'createMovementTable1652754804330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movement" ("id" SERIAL NOT NULL, "uid" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(12,3) NOT NULL, "at" date NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "loan_id" integer NOT NULL, "movement_type_id" integer NOT NULL, CONSTRAINT "uk_movement_uid" UNIQUE ("uid"), CONSTRAINT "PK_079f005d01ebda984e75c2d67ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "movement" ADD CONSTRAINT "FK_a79e55dc0161bd0336206881533" FOREIGN KEY ("loan_id") REFERENCES "loan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "movement" ADD CONSTRAINT "FK_4a3f228413c56dcff7c593c3fbf" FOREIGN KEY ("movement_type_id") REFERENCES "movement_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movement" DROP CONSTRAINT "FK_4a3f228413c56dcff7c593c3fbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "movement" DROP CONSTRAINT "FK_a79e55dc0161bd0336206881533"`,
    );
    await queryRunner.query(`DROP TABLE "movement"`);
  }
}
