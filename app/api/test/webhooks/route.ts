// app/api/test/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") || "customers/data_request";
  
  // Create test payload
  const testPayload = {
    shop_id: 12345678,
    shop_domain: "test-store.myshopify.com",
    customer: {
      id: 9876543210,
      email: "test@example.com",
      phone: "+1234567890"
    },
    orders_requested: ["order1", "order2"]
  };

  const body = JSON.stringify(testPayload);

  // Generate HMAC
  const hmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(body, 'utf8')
    .digest('base64');

  // Determine endpoint
  const endpoints: Record<string, string> = {
    'customers/data_request': '/api/webhooks/customers/data_request',
    'customers/redact': '/api/webhooks/customers/redact',
    'shop/redact': '/api/webhooks/shop/redact'
  };

  const endpoint = endpoints[topic] || endpoints['customers/data_request'];

  try {
    // Call the webhook endpoint
    const response = await fetch(`${process.env.SHOPIFY_APP_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': hmac,
        'X-Shopify-Shop-Domain': 'kr-customizer-app.myshopify.com',
        'X-Shopify-Topic': topic.toUpperCase().replace('/', '_'),
        'X-Shopify-API-Version': '2025-10'
      },
      body: body
    });

    const responseData = await response.text();

    return NextResponse.json({
      test: 'webhook',
      topic,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      hmac_sent: hmac,
      payload_sent: testPayload
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
      topic,
      endpoint
    }, { status: 500 });
  }
}