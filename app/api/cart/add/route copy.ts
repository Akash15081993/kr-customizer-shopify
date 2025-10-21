import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQLFetch } from "@/lib/shopifyGraphQLFetch";
import { getValidSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, variantId, quantity = 1, fixedPrice = 0 } = body;

    // Get valid session
    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session.accessToken;

    // Step 1: Get variant details and price
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
    const newTotalPrice = parseFloat((originalPrice + fixedPrice).toFixed(2));

    // Step 2: Build line items
    const lineItems: any[] = [
      {
        variantId: variantId,
        quantity: quantity,
        customAttributes: [
          { key: "_Design Id", value: "1" },
          { key: "_View Design", value: "2" },
          { key: "_Design Area", value: "3" },
        ],
      },
    ];

    if (fixedPrice > 0) {
      lineItems.push({
        title: `Customization addition charges`,
        quantity: quantity,
        originalUnitPrice: fixedPrice,
        requiresShipping: false,        
        taxable: false,
        customAttributes: [
          { key: "Linked Product", value: variant?.product?.title },
          { key: "View Design", value: "2" },
        ],
      });
    }

    const draftOrderInput = {
      input: {
        lineItems: lineItems
      },
    };

    // Step 3: Create Draft Order
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
                  id
                  title
                  quantity
                  originalUnitPrice
                  customAttributes { key value }
                }
              }
            }
          }
          userErrors { field message }
        }
      }
    `;

    const draftOrderResponse = await shopifyGraphQLFetch(shop, accessToken, draftOrderMutation, draftOrderInput);

    // Handle errors
    if (draftOrderResponse.data?.draftOrderCreate?.userErrors?.length > 0) {
      const error = draftOrderResponse.data.draftOrderCreate.userErrors[0];
      return NextResponse.json({ error: error.message, field: error.field }, { status: 400 });
    }

    const draftOrder = draftOrderResponse.data.draftOrderCreate.draftOrder;

    // Step 4: Return response
    return NextResponse.json({
      success: true,
      checkoutUrl: draftOrder.invoiceUrl,
      draftOrderId: draftOrder.id,
      totalPrice: draftOrder.totalPrice,
      pricing: {
        originalPrice: originalPrice,
        fixedPriceAdded: fixedPrice,
        customerPays: newTotalPrice
      },
      product: {
        title: variant.product.title,
        variant: variant.title,
        quantity: quantity,
      },
    });

  } catch (error: any) {
    console.error("❌ Error creating draft order:", error);
    return NextResponse.json({ error: "Failed to create cart", details: error.message }, { status: 500 });
  }
}
