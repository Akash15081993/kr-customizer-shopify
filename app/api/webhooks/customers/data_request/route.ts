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
    
    // Handle customer data request
    // You need to provide any customer data you've stored
    console.log('Customer data request received:', data);
    
    // IMPORTANT: Return 200 immediately, then process asynchronously
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in customers/data_request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}