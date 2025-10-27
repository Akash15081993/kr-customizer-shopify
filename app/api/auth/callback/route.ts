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

  console.log('🔔 Starting webhook registration for:', shop);
  console.log('📍 App URL:', appUrl);

  for (const webhook of webhooks) {
    try {
      console.log(`\n⏳ Registering ${webhook.topic}...`);
      console.log(`   Endpoint: ${webhook.endpoint}`);

      // Register webhook using GraphQL
      const mutation = `
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
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

      const variables = {
        topic: webhook.topic,
        webhookSubscription: {
          callbackUrl: webhook.endpoint,
          format: "JSON"
        }
      };

      const response = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: mutation, variables }),
        }
      );

      const result = await response.json();
      
      if (result.errors) {
        console.error(`❌ GraphQL errors for ${webhook.topic}:`, result.errors);
      } else if (result.data?.webhookSubscriptionCreate?.userErrors?.length > 0) {
        console.error(`⚠️  User errors for ${webhook.topic}:`, result.data.webhookSubscriptionCreate.userErrors);
      } else if (result.data?.webhookSubscriptionCreate?.webhookSubscription) {
        console.log(`✅ Successfully registered ${webhook.topic}`);
        console.log(`   ID: ${result.data.webhookSubscriptionCreate.webhookSubscription.id}`);
      } else {
        console.error(`❓ Unexpected response for ${webhook.topic}:`, result);
      }
    } catch (error) {
      console.error(`💥 Exception registering webhook ${webhook.topic}:`, error);
    }
  }

  console.log('\n✨ Webhook registration complete\n');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  const apiVersion = getCurrentShopifyVersion();

  console.log('🚀 Auth callback initiated for shop:', shop);

  if (!shop || !code) {
    console.error('❌ Missing shop or code');
    return NextResponse.json(
      { error: "Missing shop or code" },
      { status: 400 }
    );
  }

  try {
    // Exchange code for access token
    console.log('🔑 Exchanging code for access token...');
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
      console.error('❌ Failed to get access token:', data);
      throw new Error("Failed to get access token");
    }

    console.log('✅ Access token obtained');

    // Save to Prisma
    console.log('💾 Saving session to database...');
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
    console.log('✅ Session saved');

    // Fetch store info from Shopify API
    console.log('🏪 Fetching shop info...');
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
    console.log('📝 Registering store in main database...');
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
    console.log('📜 Adding script tag...');
    await AddScriptTag(shop, accessToken, shopInfo);

    // Register order webhook
    console.log('📦 Registering order webhook...');
    await RegisterOrderWebhook(shop, accessToken);
    
    // Add Metafield Product
    console.log('🏷️  Adding product metafields...');
    await AddMetafieldProduct(shop, accessToken);

    // Register mandatory GDPR webhooks (CRITICAL FOR APP REVIEW)
    await registerMandatoryWebhooks(shop, accessToken, apiVersion);

    console.log('🎉 Installation complete! Redirecting to dashboard...');

    // Redirect to /dashboard
    return NextResponse.redirect(`${process.env.SHOPIFY_APP_URL}/dashboard?shop=${shop}`);
  } catch (error) {
    console.error("💥 Error in auth callback:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}