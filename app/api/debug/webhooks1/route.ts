// app/api/debug/webhook-topics/route.ts
import { getValidSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }

  const session = await getValidSession(shop);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "No valid session" }, { status: 401 });
  }

  try {
    // Query to get all available webhook topics
    const query = `
      {
        __type(name: "WebhookSubscriptionTopic") {
          enumValues {
            name
          }
        }
      }
    `;

    const response = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}