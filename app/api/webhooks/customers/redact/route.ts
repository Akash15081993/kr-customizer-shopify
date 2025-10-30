//app/api/webhooks/customers/data_request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Return 200 for health checks
  return NextResponse.json({ 
    status: 'active',
    webhook: 'customers/redact'
  }, { status: 200 });
}

export async function POST(req: Request) {
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const body = await req.text();

  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(body, "utf8")
    .digest("base64");

  if (hash !== hmac) return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });

  console.log(" customers/data_request received");
  return NextResponse.json({ success: true });
}
