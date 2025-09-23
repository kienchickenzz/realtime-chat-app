import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUserId1758592012743 implements MigrationInterface {
    name = 'RemoveUserId1758592012743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business"."users" DROP CONSTRAINT "UQ_90a8fdabae76ae646e3b2062db0"`);
        await queryRunner.query(`ALTER TABLE "business"."users" DROP COLUMN "authUserId"`);
        await queryRunner.query(`ALTER TABLE "business"."user_presence" DROP CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841"`);
        await queryRunner.query(`ALTER TABLE "business"."messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" DROP CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014"`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" DROP CONSTRAINT "FK_73e0dec6b5702510402d210b3ac"`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" DROP CONSTRAINT "FK_b49c970adabf84fd2b013b60a99"`);
        await queryRunner.query(`ALTER TABLE "business"."users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" ADD CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "business"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" ADD CONSTRAINT "FK_b49c970adabf84fd2b013b60a99" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" ADD CONSTRAINT "FK_73e0dec6b5702510402d210b3ac" FOREIGN KEY ("createdById") REFERENCES "business"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."users" ADD CONSTRAINT "FK_a3ffb1c0c8416b9fc6f907b7433" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."user_presence" ADD CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841" FOREIGN KEY ("user_id") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business"."user_presence" DROP CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841"`);
        await queryRunner.query(`ALTER TABLE "business"."users" DROP CONSTRAINT "FK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" DROP CONSTRAINT "FK_73e0dec6b5702510402d210b3ac"`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" DROP CONSTRAINT "FK_b49c970adabf84fd2b013b60a99"`);
        await queryRunner.query(`ALTER TABLE "business"."messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" DROP CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014"`);
        await queryRunner.query(`ALTER TABLE "business"."users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" ADD CONSTRAINT "FK_b49c970adabf84fd2b013b60a99" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" ADD CONSTRAINT "FK_73e0dec6b5702510402d210b3ac" FOREIGN KEY ("createdById") REFERENCES "business"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" ADD CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "business"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."user_presence" ADD CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841" FOREIGN KEY ("user_id") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."users" ADD "authUserId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "business"."users" ADD CONSTRAINT "UQ_90a8fdabae76ae646e3b2062db0" UNIQUE ("authUserId")`);
    }

}
