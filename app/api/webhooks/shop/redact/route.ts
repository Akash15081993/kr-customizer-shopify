import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Return 200 for health checks
  return NextResponse.json({ 
    status: 'active',
    webhook: 'shop/redact'
  });
}

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
    
    // Handle shop redaction
    console.log('Shop redaction request received:', data);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in shop/redact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}