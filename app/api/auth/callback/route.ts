// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import langEng from "@/lang/en";
import prisma from "@/lib/prisma";
import { AddMetafieldProduct } from "@/lib/product/metafields";
import { AddScriptTag } from "@/lib/scriptTag";
import { RegisterOrderWebhook } from "@/lib/shopify-webhooks";
import { getCurrentShopifyVersion } from "@/lib/shopifyVersion";

// Helper function to register mandatory webhooks using GraphQL
async function registerMandatoryWebhooks(shop: string, accessToken: string, apiVersion: string) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  
  const webhooks = [
    {
      topic: "CUSTOMERS_DATA_REQUEST",
      endpoint: `${appUrl}/api/webhooks/customers/data_request`
    },
    {
      topic: "CUSTOMERS_REDACT",
      endpoint: `${appUrl}/api/webhooks/customers/redact`
    },
    {
      topic: "SHOP_REDACT",
      endpoint: `${appUrl}/api/webhooks/shop/redact`
    }
  ];

  for (const webhook of webhooks) {
    try {
      // First, check if webhook already exists
      const checkQuery = `
        query {
          webhookSubscriptions(first: 5, topics: ${webhook.topic}) {
            edges {
              node {
                id
                endpoint {
                  __typename
                  ... on WebhookHttpEndpoint {
                    callbackUrl
                  }
                }
              }
            }
          }
        }
      `;

      const checkResponse = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: checkQuery }),
        }
      );

      const checkData = await checkResponse.json();
      const existingWebhooks = checkData?.data?.webhookSubscriptions?.edges || [];

      // Check if our endpoint is already registered
      const webhookExists = existingWebhooks.some((edge: any) => 
        edge.node.endpoint?.callbackUrl === webhook.endpoint
      );

      if (webhookExists) {
        console.log(`Webhook ${webhook.topic} already exists, skipping...`);
        continue;
      }

      // Register new webhook using GraphQL
      const mutation = `
        mutation {
          webhookSubscriptionCreate(
            topic: ${webhook.topic}
            webhookSubscription: {
              callbackUrl: "${webhook.endpoint}"
              format: JSON
            }
          ) {
            webhookSubscription {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: mutation }),
        }
      );

      const result = await response.json();
      
      if (result.data?.webhookSubscriptionCreate?.userErrors?.length > 0) {
        console.error(`Error registering ${webhook.topic}:`, result.data.webhookSubscriptionCreate.userErrors);
      } else {
        console.log(`Successfully registered webhook: ${webhook.topic}`);
      }
    } catch (error) {
      console.error(`Failed to register webhook ${webhook.topic}:`, error);
    }
  }
}

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

  try {
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

    if (!accessToken) {
      throw new Error("Failed to get access token");
    }

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

    // Fetch store info from Shopify API
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

    // Add record in main table
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

    // Add ScriptTag
    await AddScriptTag(shop, accessToken, shopInfo);

    // Register order webhook
    await RegisterOrderWebhook(shop, accessToken);
    
    // Add Metafield Product
    await AddMetafieldProduct(shop, accessToken);

    // Register mandatory GDPR webhooks (CRITICAL FOR APP REVIEW)
    await registerMandatoryWebhooks(shop, accessToken, apiVersion);

    // Redirect to /dashboard
    return NextResponse.redirect(`${process.env.SHOPIFY_APP_URL}/dashboard?shop=${shop}`);
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}