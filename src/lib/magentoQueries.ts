import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
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

export const GET_PRODUCT_DETAIL = gql`
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