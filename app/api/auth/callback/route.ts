// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import langEng from "@/lang/en";
import prisma from "@/lib/prisma";
import { AddMetafieldProduct } from "@/lib/product/metafields";
import { AddScriptTag } from "@/lib/scriptTag";
import { RegisterOrderWebhook } from "@/lib/shopify-webhooks";
import { getCurrentShopifyVersion } from "@/lib/shopifyVersion";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const apiVersion = getCurrentShopifyVersion();

  if (!shop || !code)
    return NextResponse.json(
      { error: "Missing shop or code" },
      { status: 400 }
    );

  // Exchange code for access token
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  const data = await res.json();
  const accessToken = data.access_token;

  // Save to Prisma
  await prisma.session.upsert({
    where: { shop },
    update: {
      accessToken: accessToken,
      scope: process.env.SHOPIFY_API_SCOPES!,
    },
    create: {
      shop,
      accessToken: accessToken,
      scope: process.env.SHOPIFY_API_SCOPES!,
    },
  });


  //Fetch store info from Shopify API
  const shopRes = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
    headers: { "X-Shopify-Access-Token": accessToken },
  });
  const shopData = await shopRes.json();
  const shopInfo = shopData.shop;

  const shopOwner = shopInfo.shop_owner ?? "";
  const [firstName, ...lastNameParts] = shopOwner.split(" ");
  const lastName = lastNameParts.join(" ") || "";
  const email =
    shopInfo.email ?? shopInfo.customer_email ?? "unknown@example.com";
  const phone = shopInfo.phone ?? "";

  //Add recode in main table
  const payload = {
    platform: "shopify",
    storeHash: shopInfo.id.toString(),
    firstName,
    lastName,
    phone,
    storeUrl: `https://${shopInfo.domain}`,
    storeName: shopInfo.name,
    email,
    apiToken: langEng?.storeApi?.token + "-login",
  };

  await fetch(`${langEng?.storeApi?.endPoint}login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  //Add ScriptTag
  await AddScriptTag(shop, accessToken, shopInfo);

  //Register order webhook
  await RegisterOrderWebhook(shop, accessToken);
  //await RegisterGDPRWebhooks(shop, accessToken);

  //Add Metafield Product
  await AddMetafieldProduct(shop, accessToken)

  //Redirect to /dashboard
  return NextResponse.redirect(`${process.env.SHOPIFY_APP_URL}/dashboard?shop=${shop}`);
  
  
}
