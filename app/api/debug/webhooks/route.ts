// app/api/debug/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getCurrentShopifyVersion } from "@/lib/shopifyVersion";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    // Get session from database
    const session = await prisma.session.findUnique({
      where: { shop },
    });

    if (!session) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const apiVersion = getCurrentShopifyVersion();

    // Query webhooks using GraphQL
    const query = `
      query {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              id
              topic
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

    const response = await fetch(
      `https://${shop}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    const data = await response.json();

    // Filter for GDPR webhooks
    const gdprWebhooks = data?.data?.webhookSubscriptions?.edges?.filter((edge: any) => 
      ['CUSTOMERS_DATA_REQUEST', 'CUSTOMERS_REDACT', 'SHOP_REDACT'].includes(edge.node.topic)
    ) || [];

    return NextResponse.json({
      shop,
      total_webhooks: data?.data?.webhookSubscriptions?.edges?.length || 0,
      gdpr_webhooks: gdprWebhooks,
      all_webhooks: data?.data?.webhookSubscriptions?.edges || []
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ 
      error: "Failed to fetch webhooks",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}