import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductTrgmIndexes1700000000000 implements MigrationInterface {
  name = 'AddProductTrgmIndexes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_product_name_trgm ON "product" USING GIN ("name" gin_trgm_ops);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_product_brand_trgm ON "product" USING GIN ("brand" gin_trgm_ops);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_product_category_trgm ON "product" USING GIN ("category" gin_trgm_ops);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_product_description_trgm ON "product" USING GIN ("description" gin_trgm_ops);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_product_sku_trgm ON "product" USING GIN ("sku" gin_trgm_ops);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_sku_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_description_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_category_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_brand_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_product_name_trgm;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }
}

