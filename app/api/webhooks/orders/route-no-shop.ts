import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET!;

function verifyHmac(req: NextRequest, rawBody: string): boolean {
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
  const digest = crypto
    .createHmac("sha256", SHOPIFY_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyHmac(req, rawBody)) {
    return NextResponse.json({ ok: false, message: "Invalid HMAC" }, { status: 401 });
  }

  const orderData = JSON.parse(rawBody);

  // payload?.line_items?.map((ls:any) => {
  //   console.log(ls?.properties)
  // })

  // Do something with order payload
  return NextResponse.json({ ok: true });
}
