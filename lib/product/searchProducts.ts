import { shopifyGraphQLFetch } from "../shopifyGraphQLFetch";

export async function searchProducts(shop: string, accessToken: string, term: string) {
  const queryString = `title:*${term}* OR sku:*${term}*`;

  const query = `
    query($queryString: String!) {
      products(first: 50, sortKey: CREATED_AT, reverse: true, query: $queryString) {
        edges {
          node {
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
            # Query specific metafields
            krcConfig: metafield(namespace: "custom", key: "krcConfig") { value }
          }
        }
      }
    }
  `;

  const product = await shopifyGraphQLFetch(shop, accessToken, query, { queryString });
  return product?.data?.products?.edges?.map((edge: any) => edge.node);
}

// designId: metafield(namespace: "custom", key: "design_id") { value }
// viewDesign: metafield(namespace: "custom", key: "view_design") { value }
// designArea: metafield(namespace: "custom", key: "design_area") { value }

// metafields(first: 10, namespace: "custom") {
//   edges {
//     node {
//       id
//       namespace
//       key
//       value
//       type
//     }
//   }
// }