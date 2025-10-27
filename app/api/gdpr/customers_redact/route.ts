import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const body = await request.text();
    
    // Verify HMAC
    const generatedHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(body)
      .digest('base64');

    if (hmac !== generatedHash) {
      console.error('Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const shop = data.shop_domain;
    
    console.log("gdpr/customers_redact", data, shop);
    
    return NextResponse.json({ message: "ok" });
  } catch (error) {
    console.error('Error in customers_redact:', error);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}