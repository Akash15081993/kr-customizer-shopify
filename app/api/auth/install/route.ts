// app/api/auth/install/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");

  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const scopes = process.env.SHOPIFY_API_SCOPES;
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/auth/callback`;
  const state = shop;


  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;

  return NextResponse.redirect(installUrl);
}