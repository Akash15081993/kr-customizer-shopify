import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, orderId } = body;

    if (!shop || !orderId) {
      return NextResponse.json(
        { error: "Shop and orderId are required" },
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
      orderId: orderId.toString(),
      apiToken: `${langEng?.storeApi?.token}-order-items`,
    };

    console.log('Fetching order items with payload:', payload);

    const itemsRes = await fetch(`${langEng?.storeApi?.endPoint}order/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!itemsRes.ok) {
      throw new Error(`Order items API responded with ${itemsRes.status}`);
    }

    const itemsData = await itemsRes.json();

    return NextResponse.json({
      success: true,
      orders: itemsData?.data || [],
      status: true,
    });
  } catch (error: any) {
    console.error("Order Items API Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Internal server error",
        orders: [],
        status: false
      }, 
      { status: 500 }
    );
  }
}