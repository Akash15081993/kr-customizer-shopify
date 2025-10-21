import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop } = body;

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
      apiToken: `${langEng?.storeApi?.token}-settings-get`,
    };

    const settingsRes = await fetch(`${langEng?.storeApi?.endPoint}settings/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!settingsRes.ok) {
      // If no settings found, return default values
      return NextResponse.json({
        success: true,
        data: {
          enableShare: false,
          designerButtonName: "Customize",
          designerButton: "",
          cssCode: ".example-css-custom{color:red;}",
        },
        status: true,
      });
    }

    const settingsData = await settingsRes.json();

    return NextResponse.json({
      success: true,
      data: settingsData?.data || {
        enableShare: false,
        designerButtonName: "Customize",
        designerButton: "",
        cssCode: ".example-css-custom{color:red;}",
      },
      status: true,
    });
  } catch (error: any) {
    console.error("Settings Get API Error:", error);
    // Return default values on error
    return NextResponse.json({
      success: true,
      data: {
        enableShare: false,
        designerButtonName: "Customize",
        designerButton: "",
        cssCode: ".example-css-custom{color:red;}",
      },
      status: true,
    });
  }
}