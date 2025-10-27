//app/api/webhooks/customers/data_request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Return 200 for health checks
  return NextResponse.json({ 
    status: 'active',
    webhook: 'customers/data_request'
  }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    
    // Read body as text
    const body = await request.text();
    
    if (!hmac) {
      console.error('Missing HMAC header');
      return NextResponse.json({ error: 'Missing HMAC' }, { status: 401 });
    }

    // Verify HMAC - CRITICAL: Use the raw body text
    const generatedHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(body, 'utf8')
      .digest('base64');

    if (hmac !== generatedHash) {
      console.error('Invalid HMAC signature', {
        received: hmac,
        expected: generatedHash,
        shop: shopDomain
      });
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    // Parse the verified body
    const data = JSON.parse(body);
    
    // Handle customer data request
    console.log('Customer data request received:', {
      shop: shopDomain,
      customer_id: data.customer?.id,
      orders_requested: data.orders_requested
    });
    
    // TODO: Implement actual data collection logic here
    // You should collect all customer data and send it to the customer
    
    // IMPORTANT: Return 200 immediately
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in customers/data_request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable body parsing to get raw body for HMAC verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';