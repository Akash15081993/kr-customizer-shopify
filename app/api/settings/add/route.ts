import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      shop, 
      enableShare, 
      designerButtonName, 
      designerButton, 
      addtocartForm,
      cssCode 
    } = body;

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
      userId: "0",
      enableShare: Boolean(enableShare),
      designerButtonName: designerButtonName?.toString() || "Customize",
      designerButton: designerButton?.toString() || "",
      addtocartForm: addtocartForm?.toString() || "",
      cssCode: cssCode?.toString() || "",
      apiToken: `${langEng?.storeApi?.token}-settings-save`,
    };

    const saveRes = await fetch(`${langEng?.storeApi?.endPoint}settings/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!saveRes.ok) {
      throw new Error(`Settings save API responded with ${saveRes.status}`);
    }

    const saveData = await saveRes.json();

    return NextResponse.json({
      success: true,
      status: saveData?.status || true,
      message: "Settings saved successfully",
      data: saveData?.data || payload,
    });
  } catch (error: any) {
    console.error("Settings Save API Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to save settings",
        status: false
      }, 
      { status: 500 }
    );
  }
}