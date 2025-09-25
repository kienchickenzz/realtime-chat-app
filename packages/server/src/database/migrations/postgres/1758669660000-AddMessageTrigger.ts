import { MigrationInterface, QueryRunner } from "typeorm"
  
export class AddMessageTrigger1758669660000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_new_message()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Publish message event to Redis
                PERFORM pg_notify('new_message', 
                    json_build_object(
                        'messageId', NEW.id,
                        'senderId', NEW."senderId"
                    )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER message_insert_trigger
            AFTER INSERT ON business.messages
            FOR EACH ROW
            EXECUTE FUNCTION notify_new_message();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS message_insert_trigger ON business.messages`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS notify_new_message()`);
    }
}
