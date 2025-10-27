// app/api/webhooks/[topic]/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ topic: string }> } // ✅ params is a Promise
) {
  // ✅ Await the params first
  const { topic } = await params;
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") || "";

  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET as any)
    .update(rawBody, "utf8")
    .digest("base64");

  if (digest !== hmacHeader) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  // ✅ Verified webhook
  const data = JSON.parse(rawBody);
  console.log("Received webhook:", topic, data);

  // Example: handle uninstall
  if (topic === "app_uninstalled") {
    console.log(`App uninstalled from ${data.domain || data.shop_domain}`);
  }

  return NextResponse.json({ success: true });
}