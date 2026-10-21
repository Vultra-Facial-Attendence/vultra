import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateManagers1792604963203 implements MigrationInterface {
  name = 'CreateManagers1792604963203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "managers" ("id" uuid NOT NULL DEFAULT uuidv7(), "email" text NOT NULL, "password_hash" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8d5fd9a2217bf7b16bef11fdf83" UNIQUE ("email"), CONSTRAINT "managers_email_length" CHECK (char_length(email) <= 254), CONSTRAINT "managers_email_lowercase" CHECK (email = lower(email)), CONSTRAINT "PK_e70b8cc457276d9b4d82342a8ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "manager_sessions" ("id" text NOT NULL, "manager_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_7ffdff5f878dbd9bddd92661fa5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6d25ebcc34c8c484efab2315a" ON "manager_sessions"  ("manager_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "manager_sessions" ADD CONSTRAINT "FK_d6d25ebcc34c8c484efab2315a8" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "manager_sessions" DROP CONSTRAINT "FK_d6d25ebcc34c8c484efab2315a8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6d25ebcc34c8c484efab2315a"`,
    );
    await queryRunner.query(`DROP TABLE "manager_sessions"`);
    await queryRunner.query(`DROP TABLE "managers"`);
  }
}
