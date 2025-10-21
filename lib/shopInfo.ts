import langEng from "@/lang/en";
import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function ShopInfo<T>(
  shop: string,
  accessToken: string
): Promise<T> {
  
  const apiVersion = getCurrentShopifyVersion();

  //Fetch store info from Shopify API
  const shopRes = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
    headers: { "X-Shopify-Access-Token": accessToken },
  });
  const shopData = await shopRes.json();
  const shopInfo = shopData?.shop;
  
  return shopInfo;
}