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
    
    // Handle customer data redaction - delete all customer data
    console.log('Customer redaction request received:', data);
    
    // Delete any customer data you've stored
    // This is mandatory for GDPR compliance
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in customers/redact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}