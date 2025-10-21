//lib\shopifyGraphQLFetch.ts
import langEng from "@/lang/en";
import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function shopifyGraphQLFetch(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, any> = {}
) {
  
  const apiVersion = getCurrentShopifyVersion();
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Shopify GraphQL Error: ${err}`);
  }

  return response.json();
}
