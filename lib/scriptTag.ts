//lib\scriptTag.ts
import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function AddScriptTag(shop: string, accessToken: string, shopData: any) {
  const apiVersion = getCurrentShopifyVersion();
  
  // Include shop data as query parameters in the script URL
  const scriptUrl = new URL(process.env.SHOPIFY_APP_URL + "/scripts/config.v1.js");
  // Add shop data as query parameters
  scriptUrl.searchParams.append('shop_domain', shop);
  scriptUrl.searchParams.append('shop_id', shopData.id || '');

  const url = `https://${shop}/admin/api/${apiVersion}/script_tags.json`;

  const body = {
    script_tag: {
      event: "onload",
      src: scriptUrl.toString(), // Full URL with query params
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data;
}
