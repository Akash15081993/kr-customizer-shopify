// app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import { searchProducts } from "@/lib/product/searchProducts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const term = searchParams.get("q") || "";

  if (!shop) {
    return NextResponse.json({ error: "Shop missing" }, { status: 400 });
  }

  const session = await getValidSession(shop);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const results = await searchProducts(shop, session.accessToken, term);

  return NextResponse.json(results);
}
