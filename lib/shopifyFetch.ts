//lib\shopifyFetch.ts
import langEng from "@/lang/en";
import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function shopifyFetch<T>(
  shop: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiVersion = getCurrentShopifyVersion();
  const url = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${errorText}`);
  }

  return res.json();
}