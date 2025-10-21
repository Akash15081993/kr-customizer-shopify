import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, page = 1, limit = 15, searchTerm = "" } = body;

    if (!shop) {
      return NextResponse.json(
        { error: "Shop is required" },
        { status: 400 }
      );
    }

    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session.accessToken;
    const shopInfo = await ShopInfo(shop, accessToken);

    const payload = {
      storeHash: (shopInfo as any)?.id?.toString(),
      page: parseInt(page),
      limit: parseInt(limit),
      searchTerm: searchTerm.toString(), // Ensure string
      apiToken: `${langEng?.storeApi?.token}-order-list`,
    };

    const orderRes = await fetch(`${langEng?.storeApi?.endPoint}order/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!orderRes.ok) {
      throw new Error(`Orders API responded with ${orderRes.status}`);
    }

    const ordersData = await orderRes.json();

    return NextResponse.json({
      success: true,
      data: ordersData?.data || { orders: [], pagination: {} },
    });
  } catch (error: any) {
    console.error("Orders List API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}