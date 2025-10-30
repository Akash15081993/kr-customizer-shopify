import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    //Verify JWT signature from Shopify
    const decoded = jwt.verify(token, SHOPIFY_API_SECRET);
    
    return NextResponse.json({ success: true, message: "Token verified", decoded });
  } catch (err: any) {
    console.error("❌ Token verification failed:", err.message);
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Shopify Token Verification API" });
}
