//lib\shopify.ts
import { Session } from "@shopify/shopify-api";
import prisma from "./prisma";
import { getCurrentShopifyVersion } from "./shopifyVersion";

// Implement session storage object (no imports needed)
export const prismaSessionStorage = {

  async storeSession(session: Session) {
    if (!session.accessToken) throw new Error("Session missing accessToken");
    if (!session.scope) throw new Error("Session missing scope");
    await prisma.session.upsert({
      where: { shop: session.shop },
      update: {
        accessToken: session.accessToken,
        scope: session.scope,
        expires: session.expires,
      },
      create: {
        shop: session.shop,
        accessToken: session.accessToken,
        scope: session.scope,
        expires: session.expires,
      },
    });
    return true;
  },

  async loadSession(id: string) {
    const s = await prisma?.session?.findUnique({ where: { shop: id } });
    if (!s) return undefined;

    return new Session({
      id: s.shop, // session ID
      shop: s.shop, // shop domain
      state: s.shop, // any unique string, you can use shop
      isOnline: true, // online session
      accessToken: s.accessToken!,
      scope: s.scope!,
      expires: s.expires ?? undefined,
    });
  },

  async deleteSession(id: string) {
    await prisma.session.delete({ where: { shop: id } });
    return true;
  },

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const sessions = await prisma.session.findMany({ where: { shop } });
    return sessions.map(
      (s) =>
        new Session({
          id: s.shop, // session ID
          shop: s.shop, // shop domain
          state: s.shop, // REQUIRED string
          isOnline: true, // online session
          accessToken: s.accessToken!, // non-null
          scope: s.scope!, // non-null
          expires: s.expires ?? undefined,
        })
    );
  },
};

const apiVersion = getCurrentShopifyVersion();

export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_API_SCOPES!.split(","),
  hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ""),
  apiVersion: apiVersion,
  isEmbeddedApp: true,
  sessionStorage: prismaSessionStorage, // your Prisma storage object
};
