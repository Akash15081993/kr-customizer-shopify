import { shopifyGraphQLFetch } from "../shopifyGraphQLFetch";

export async function searchProductsById(shop: string, accessToken: string, productId: string) {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
        options(first: 100) {
          id
          name
          values
        }
        variants(first: 100) {
          edges {
            node {
              id
              sku
              price
            }
          }
        }
        krcConfig: metafield(namespace: "custom", key: "krcConfig") {
          value
        }
      }
    }
  `;

  const response = await shopifyGraphQLFetch(shop, accessToken, query, { id: productId });
  return response?.data?.product || null;
}
