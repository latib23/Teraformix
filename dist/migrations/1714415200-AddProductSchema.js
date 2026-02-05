"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProductSchema1714415200 = void 0;
class AddProductSchema1714415200 {
    constructor() {
        this.name = 'AddProductSchema1714415200';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "schema" jsonb DEFAULT '{}'::jsonb NOT NULL`);
        await queryRunner.query(`
      UPDATE "product"
      SET "schema" = jsonb_strip_nulls(jsonb_build_object(
        'mpn', to_jsonb(attributes->>'__schema_mpn'),
        'itemCondition', to_jsonb(attributes->>'__schema_itemCondition'),
        'gtin13', to_jsonb(attributes->>'__schema_gtin13'),
        'gtin14', to_jsonb(attributes->>'__schema_gtin14'),
        'priceValidUntil', to_jsonb(attributes->>'__schema_priceValidUntil'),
        'seller', to_jsonb(attributes->>'__schema_seller'),
        'ratingValue', to_jsonb((attributes->>'__schema_ratingValue')::numeric),
        'reviewCount', to_jsonb((attributes->>'__schema_reviewCount')::int),
        'reviews', attributes->'__schema_reviews'
      ))
    `);
        await queryRunner.query(`
      UPDATE "product"
      SET attributes = attributes
        - '__schema_mpn'
        - '__schema_itemCondition'
        - '__schema_gtin13'
        - '__schema_gtin14'
        - '__schema_priceValidUntil'
        - '__schema_seller'
        - '__schema_ratingValue'
        - '__schema_reviewCount'
        - '__schema_reviews'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      UPDATE "product"
      SET attributes = attributes || jsonb_strip_nulls(jsonb_build_object(
        '__schema_mpn', to_jsonb("schema"->>'mpn'),
        '__schema_itemCondition', to_jsonb("schema"->>'itemCondition'),
        '__schema_gtin13', to_jsonb("schema"->>'gtin13'),
        '__schema_gtin14', to_jsonb("schema"->>'gtin14'),
        '__schema_priceValidUntil', to_jsonb("schema"->>'priceValidUntil'),
        '__schema_seller', to_jsonb("schema"->>'seller'),
        '__schema_ratingValue', to_jsonb(("schema"->>'ratingValue')::numeric),
        '__schema_reviewCount', to_jsonb(("schema"->>'reviewCount')::int),
        '__schema_reviews', "schema"->'reviews'
      ))
    `);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "schema"`);
    }
}
exports.AddProductSchema1714415200 = AddProductSchema1714415200;
//# sourceMappingURL=1714415200-AddProductSchema.js.map