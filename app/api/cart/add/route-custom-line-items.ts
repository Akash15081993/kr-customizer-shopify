import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQLFetch } from "@/lib/shopifyGraphQLFetch";
import { getValidSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, variantId, quantity = 1, fixedPrice = 0 } = body;

    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session.accessToken;

    // Get variant info (for product title only)
    const variantQuery = `
      query getVariant($id: ID!) {
        productVariant(id: $id) {
          id
          title
          price
          product { title }
        }
      }
    `;
    const variantResponse = await shopifyGraphQLFetch(shop, accessToken, variantQuery, { id: variantId });
    if (!variantResponse.data?.productVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const variant = variantResponse.data.productVariant;
    const originalPrice = parseFloat(variant.price);
    const customPrice = originalPrice + fixedPrice;

    // ✅ Single custom line item (no variantId)
    const draftOrderMutation = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
            totalPrice
            subtotalPrice
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPrice
                }
              }
            }
          }
          userErrors { field message }
        }
      }
    `;

    const draftOrderInput = {
      input: {
        lineItems: [
          {
            title: `${variant.product.title} - ${variant.title}`,
            quantity,
            originalUnitPrice: customPrice, // 👈 your custom price
            customAttributes: [
              { key: "original_price", value: originalPrice.toString() },
              { key: "custom_fee", value: fixedPrice.toString() },
              { key: "custom_price_applied", value: "true" },
            ],
          },
        ],
        note: `Single item custom price applied (${originalPrice} + ${fixedPrice} = ${customPrice})`,
      },
    };

    const response = await shopifyGraphQLFetch(shop, accessToken, draftOrderMutation, draftOrderInput);

    if (response.data?.draftOrderCreate?.userErrors?.length > 0) {
      const err = response.data.draftOrderCreate.userErrors[0];
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }

    const draftOrder = response.data.draftOrderCreate.draftOrder;

    return NextResponse.json({
      success: true,
      checkoutUrl: draftOrder.invoiceUrl,
      draftOrderId: draftOrder.id,
      totalPrice: draftOrder.totalPrice,
      product: {
        title: `${variant.product.title} - ${variant.title}`,
        customPrice,
      },
      message: `✅ Single item created with custom price ${customPrice}`,
    });
  } catch (error: any) {
    console.error("❌ Error creating draft order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
