//app/api/webhooks/shop/redact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Return 200 for health checks
  return NextResponse.json({ 
    status: 'active',
    webhook: 'shop/redact'
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

    // Verify HMAC
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
    
    // Handle shop redaction
    console.log('Shop redaction request received:', {
      shop_id: data.shop_id,
      shop_domain: data.shop_domain
    });
    
    // TODO: Implement actual shop data deletion logic here
    // You should delete ALL data related to this shop from your database
    // This includes: sessions, webhooks, orders, products, etc.
    
    // Example:
    // await prisma.session.delete({ where: { shop: data.shop_domain } });
    // await prisma.orders.deleteMany({ where: { shop: data.shop_domain } });
    // ... delete all other related data
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in shop/redact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable body parsing to get raw body for HMAC verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';