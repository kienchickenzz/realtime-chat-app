import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTables1758858021429 implements MigrationInterface {
    name = 'AddTables1758858021429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth"."roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "description" text, "permissions" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth"."user_role" ("userId" uuid NOT NULL, "roleId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b4e17a669299579dfa55a3fc35" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`ALTER TABLE "auth"."user_role" ADD CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth"."user_role" ADD CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b" FOREIGN KEY ("roleId") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth"."user_role" DROP CONSTRAINT "FK_dba55ed826ef26b5b22bd39409b"`);
        await queryRunner.query(`ALTER TABLE "auth"."user_role" DROP CONSTRAINT "FK_ab40a6f0cd7d3ebfcce082131fd"`);
        await queryRunner.query(`DROP TABLE "auth"."user_role"`);
        await queryRunner.query(`DROP TABLE "auth"."roles"`);
    }

}
