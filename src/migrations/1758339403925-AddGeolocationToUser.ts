import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeolocationToUser1758339403925 implements MigrationInterface {
    name = 'AddGeolocationToUser1758339403925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "geolocationId" uuid`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "UQ_8cebaf072c44d0ff4c51d2544e6" UNIQUE ("geolocationId")`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_8cebaf072c44d0ff4c51d2544e6" FOREIGN KEY ("geolocationId") REFERENCES "geolocation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_8cebaf072c44d0ff4c51d2544e6"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "UQ_8cebaf072c44d0ff4c51d2544e6"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "geolocationId"`);
    }

}
