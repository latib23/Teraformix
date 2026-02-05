import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddProductSchema1714415200 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
