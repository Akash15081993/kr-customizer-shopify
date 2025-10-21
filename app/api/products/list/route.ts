// app/api/products/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, page = 1, limit = 5, searchTerm = "" } = body;

    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session?.accessToken;

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: shop, accessToken" },
        { status: 400 }
      );
    }

    const shopInfo = await ShopInfo(shop, accessToken);

    const payload = {
      storeHash: (shopInfo as any)?.id?.toString(),
      page,
      limit,
      searchTerm,
      apiToken: `${langEng?.storeApi?.token}-product-list`,
    };

    const productRes = await fetch(`${langEng?.storeApi?.endPoint}product/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const product = await productRes.json();

    return NextResponse.json({
      success: true,
      data: product?.data,
    });
  } catch (error) {
    console.error("Product List Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}