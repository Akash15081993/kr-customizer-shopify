// lib/session.ts
import prisma from "./prisma";
import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function getValidSession(shop: string) {
  const apiVersion = getCurrentShopifyVersion();

  if(!shop){
    return null
  }

  const session = await prisma?.session?.findUnique({ where: { shop } });

  if (!session || !session.accessToken) {
    return null; // missing
  }

  //Validate token with Shopify API
  try {
    
    const res = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
        headers: { "X-Shopify-Access-Token": session.accessToken },
    });

    if (res.status === 401) {
      // token invalid → delete session
      await prisma?.session?.delete({ where: { shop } });
      return null;
    }

    return session;
  } catch (err) {
    console.error("Token validation failed", err);
    return null;
  }
}
