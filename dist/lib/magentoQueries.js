"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_PRODUCT_DETAIL = exports.GET_PRODUCTS = void 0;
const client_1 = require("@apollo/client");
exports.GET_PRODUCTS = (0, client_1.gql) `
  query GetProducts($search: String, $pageSize: Int = 20) {
    products(search: $search, pageSize: $pageSize) {
      items {
        sku
        name
        stock_status
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
        image {
          url
        }
      }
    }
  }
`;
exports.GET_PRODUCT_DETAIL = (0, client_1.gql) `
  query GetProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        sku
        name
        description {
          html
        }
        stock_status
        image {
          url
        }
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
        media_gallery {
          url
          label
        }
        # Custom attributes can be fetched here
        short_description {
          html
        }
      }
    }
  }
`;
//# sourceMappingURL=magentoQueries.js.map