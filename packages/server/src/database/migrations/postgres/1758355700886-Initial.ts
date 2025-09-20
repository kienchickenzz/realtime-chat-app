import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758355700886 implements MigrationInterface {
    name = 'Initial1758355700886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "business"."message_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileUrl" text NOT NULL, "fileName" character varying(255) NOT NULL, "fileType" character varying(100), "fileSize" bigint, "thumbnailUrl" text, "width" integer, "height" integer, "duration" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "messageId" uuid, CONSTRAINT "PK_e5085d973567c61e9306f10f95b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b4f24737fcb6b35ffdd4d16e1" ON "business"."message_attachments" ("messageId") `);
        await queryRunner.query(`CREATE TABLE "business"."message_read_receipts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "readAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "messageId" uuid, "userId" uuid, CONSTRAINT "UQ_14760574686d908c45d6d01e66b" UNIQUE ("messageId", "userId"), CONSTRAINT "PK_765a476d3a8f61e3cb7e634a12d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b27375e3d32b327050103cf6d" ON "business"."message_read_receipts" ("messageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1623e4199eb5e0d7296a8b7001" ON "business"."message_read_receipts" ("userId") `);
        await queryRunner.query(`CREATE TABLE "business"."messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text, "messageType" character varying(20) NOT NULL DEFAULT 'text', "threadCount" integer NOT NULL DEFAULT '0', "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "conversationId" uuid, "senderId" uuid, "parentMessageId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "business"."messages" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2db9cf2b3ca111742793f6c37c" ON "business"."messages" ("senderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2eeda8980b7f51baed776ede6a" ON "business"."messages" ("messageType") `);
        await queryRunner.query(`CREATE INDEX "IDX_379d3b2679ddf515e5a90de015" ON "business"."messages" ("parentMessageId") `);
        await queryRunner.query(`CREATE TABLE "business"."conversation_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" character varying(20) NOT NULL DEFAULT 'member', "nickname" character varying(100), "isMuted" boolean NOT NULL DEFAULT false, "mutedUntil" TIMESTAMP WITH TIME ZONE, "notificationLevel" character varying(20) NOT NULL DEFAULT 'all', "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "leftAt" TIMESTAMP WITH TIME ZONE, "unreadCount" integer NOT NULL DEFAULT '0', "conversationId" uuid, "userId" uuid, "lastReadMessageId" uuid, CONSTRAINT "UQ_cfbb3b06abdf7a6c34ca12035d2" UNIQUE ("conversationId", "userId"), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a23e356db3cedb8d9725d01d1" ON "business"."conversation_members" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b49c970adabf84fd2b013b60a9" ON "business"."conversation_members" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3243767685e8899829984a5ca3" ON "business"."conversation_members" ("role") `);
        await queryRunner.query(`CREATE TABLE "business"."conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL DEFAULT 'direct', "name" character varying(255), "description" text, "avatarUrl" text, "isPinned" boolean NOT NULL DEFAULT false, "maxMembers" integer NOT NULL DEFAULT '100', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2973bf1a3c7f304f4aa829bb50" ON "business"."conversations" ("type") `);
        await queryRunner.query(`CREATE TABLE "business"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authUserId" uuid NOT NULL, "displayName" character varying(100) NOT NULL, "avatarUrl" text, "bio" text, "status" character varying(20) NOT NULL DEFAULT 'offline', "lastSeenAt" TIMESTAMP WITH TIME ZONE, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_90a8fdabae76ae646e3b2062db0" UNIQUE ("authUserId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3676155292d72c67cd4e090514" ON "business"."users" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b0e1a27f5119514e54547f02c8" ON "business"."users" ("lastSeenAt") `);
        await queryRunner.query(`CREATE TABLE "business"."user_presence" ("userId" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'offline', "lastActiveAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "activeDeviceCount" integer NOT NULL DEFAULT '0', "lastDeviceInfo" jsonb, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_43f028b293e5eb2fba96d8d584" UNIQUE ("user_id"), CONSTRAINT "PK_b06e00b58bf86a3772b1251ac02" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd02185072398439bbb89c5d6f" ON "business"."user_presence" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3e71795d53a1f3dbf402420c8b" ON "business"."user_presence" ("lastActiveAt") `);
        await queryRunner.query(`CREATE TABLE "auth"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "credential" text, "tempToken" text, "tokenExpiry" TIMESTAMP, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "business"."message_attachments" ADD CONSTRAINT "FK_5b4f24737fcb6b35ffdd4d16e13" FOREIGN KEY ("messageId") REFERENCES "business"."messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" ADD CONSTRAINT "FK_7b27375e3d32b327050103cf6df" FOREIGN KEY ("messageId") REFERENCES "business"."messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" ADD CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "business"."conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "business"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."messages" ADD CONSTRAINT "FK_379d3b2679ddf515e5a90de0153" FOREIGN KEY ("parentMessageId") REFERENCES "business"."messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" ADD CONSTRAINT "FK_9a23e356db3cedb8d9725d01d1a" FOREIGN KEY ("conversationId") REFERENCES "business"."conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" ADD CONSTRAINT "FK_b49c970adabf84fd2b013b60a99" FOREIGN KEY ("userId") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" ADD CONSTRAINT "FK_132bdbaef1c34c7940c959fa35e" FOREIGN KEY ("lastReadMessageId") REFERENCES "business"."messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" ADD CONSTRAINT "FK_73e0dec6b5702510402d210b3ac" FOREIGN KEY ("createdById") REFERENCES "business"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business"."user_presence" ADD CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841" FOREIGN KEY ("user_id") REFERENCES "business"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business"."user_presence" DROP CONSTRAINT "FK_43f028b293e5eb2fba96d8d5841"`);
        await queryRunner.query(`ALTER TABLE "business"."conversations" DROP CONSTRAINT "FK_73e0dec6b5702510402d210b3ac"`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" DROP CONSTRAINT "FK_132bdbaef1c34c7940c959fa35e"`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" DROP CONSTRAINT "FK_b49c970adabf84fd2b013b60a99"`);
        await queryRunner.query(`ALTER TABLE "business"."conversation_members" DROP CONSTRAINT "FK_9a23e356db3cedb8d9725d01d1a"`);
        await queryRunner.query(`ALTER TABLE "business"."messages" DROP CONSTRAINT "FK_379d3b2679ddf515e5a90de0153"`);
        await queryRunner.query(`ALTER TABLE "business"."messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "business"."messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" DROP CONSTRAINT "FK_1623e4199eb5e0d7296a8b70014"`);
        await queryRunner.query(`ALTER TABLE "business"."message_read_receipts" DROP CONSTRAINT "FK_7b27375e3d32b327050103cf6df"`);
        await queryRunner.query(`ALTER TABLE "business"."message_attachments" DROP CONSTRAINT "FK_5b4f24737fcb6b35ffdd4d16e13"`);
        await queryRunner.query(`DROP TABLE "auth"."users"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_3e71795d53a1f3dbf402420c8b"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_bd02185072398439bbb89c5d6f"`);
        await queryRunner.query(`DROP TABLE "business"."user_presence"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_b0e1a27f5119514e54547f02c8"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_3676155292d72c67cd4e090514"`);
        await queryRunner.query(`DROP TABLE "business"."users"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_2973bf1a3c7f304f4aa829bb50"`);
        await queryRunner.query(`DROP TABLE "business"."conversations"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_3243767685e8899829984a5ca3"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_b49c970adabf84fd2b013b60a9"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_9a23e356db3cedb8d9725d01d1"`);
        await queryRunner.query(`DROP TABLE "business"."conversation_members"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_379d3b2679ddf515e5a90de015"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_2eeda8980b7f51baed776ede6a"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_2db9cf2b3ca111742793f6c37c"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_e5663ce0c730b2de83445e2fd1"`);
        await queryRunner.query(`DROP TABLE "business"."messages"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_1623e4199eb5e0d7296a8b7001"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_7b27375e3d32b327050103cf6d"`);
        await queryRunner.query(`DROP TABLE "business"."message_read_receipts"`);
        await queryRunner.query(`DROP INDEX "business"."IDX_5b4f24737fcb6b35ffdd4d16e1"`);
        await queryRunner.query(`DROP TABLE "business"."message_attachments"`);
    }

}
